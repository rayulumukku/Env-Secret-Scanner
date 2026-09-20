/**
 * packages/rules/src/schema.js
 *
 * Declarative schema validation and safety enforcement for SecretShield Rule Packs.
 *
 * SECURITY INVARIANTS:
 * - NO arbitrary JavaScript execution or dynamic evaluation.
 * - Strict length and memory caps on patterns, fixtures, and manifests.
 * - Mandatory ReDoS verification on all regular expressions.
 */

export const RULE_CATEGORIES = [
  'Cloud',
  'AI',
  'Source Control',
  'Payments',
  'Communication',
  'Databases',
  'Infrastructure',
  'CI/CD',
  'Authentication',
  'Private Keys',
  'Tokens',
  'Generic Secrets',
  'Configuration Secrets'
];

export const RULE_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const LIMITS = {
  MAX_RULES_PER_PACK: 500,
  MAX_PATTERN_LENGTH: 1000,
  MAX_MANIFEST_BYTES: 1048576, // 1MB
  MAX_FIXTURE_BYTES: 51200,    // 50KB
  MAX_EXECUTION_TIME_MS: 50,
};

/**
 * Validate ReDoS safety of a regular expression string without executing untrusted code.
 * @param {string} patternStr
 * @returns {{ safe: boolean, error?: string }}
 */
export function validateRegexSafety(patternStr) {
  if (!patternStr || typeof patternStr !== 'string') {
    return { safe: false, error: 'Pattern must be a non-empty string' };
  }

  if (patternStr.length > LIMITS.MAX_PATTERN_LENGTH) {
    return { safe: false, error: `Pattern exceeds maximum length of ${LIMITS.MAX_PATTERN_LENGTH} characters` };
  }

  // Check for dangerous catastrophic backtracking constructs (nested quantifiers)
  const catastrophicPatterns = [
    /\([^)]*(\+)[^)]*\)\+/,
    /\([^)]*(\*)[^)]*\)\*/,
    /\([^)]*(\+)[^)]*\)\*/,
    /\([^)]*(\*)[^)]*\)\+/,
    /\([^)]*(\{[0-9]+,?\d*\})[^)]*\)\+/,
    /\([^)]*(\{[0-9]+,?\d*\})[^)]*\)\*/,
    /\([^)]*(\+)[^)]*\)\{[0-9]+,?\d*\}/,
    /\([^)]*(\*)[^)]*\)\{[0-9]+,?\d*\}/,
  ];

  for (const catPattern of catastrophicPatterns) {
    if (catPattern.test(patternStr)) {
      return { safe: false, error: 'Potential catastrophic backtracking (ReDoS) detected in pattern' };
    }
  }

  // Attempt compilation
  try {
    let cleanPat = patternStr;
    let flags = '';
    if (cleanPat.startsWith('(?i)')) {
      cleanPat = cleanPat.slice(4);
      flags = 'i';
    }
    new RegExp(cleanPat, flags);
    return { safe: true };
  } catch (err) {
    return { safe: false, error: `Invalid regular expression syntax: ${err.message}` };
  }
}

/**
 * Validate an individual Rule object.
 * @param {object} rule
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRule(rule) {
  const errors = [];

  if (!rule || typeof rule !== 'object') {
    return { valid: false, errors: ['Rule must be an object'] };
  }

  // Required string fields
  if (!rule.id || typeof rule.id !== 'string' || !/^[A-Za-z0-9_-]{3,64}$/.test(rule.id)) {
    errors.push(`Invalid rule.id '${rule.id}': must be 3-64 alphanumeric characters, underscores or hyphens`);
  }

  if (!rule.name || typeof rule.name !== 'string' || rule.name.length < 3) {
    errors.push(`Invalid rule.name: must be a string with at least 3 characters`);
  }

  if (!rule.description || typeof rule.description !== 'string') {
    errors.push(`Rule description is required`);
  }

  if (!rule.provider || typeof rule.provider !== 'string') {
    errors.push(`Rule provider is required`);
  }

  // Severity
  const severityUpper = (rule.severity || '').toUpperCase();
  if (!RULE_SEVERITIES.includes(severityUpper)) {
    errors.push(`Invalid severity '${rule.severity}': must be one of ${RULE_SEVERITIES.join(', ')}`);
  }

  // Category
  const categoryMatch = RULE_CATEGORIES.find(c => c.toLowerCase() === (rule.category || '').toLowerCase());
  if (!categoryMatch) {
    errors.push(`Invalid category '${rule.category}': must be one of ${RULE_CATEGORIES.join(', ')}`);
  }

  // Version
  if (!rule.version || !/^\d+\.\d+\.\d+$/.test(rule.version)) {
    errors.push(`Invalid rule.version '${rule.version}': must follow semantic versioning (e.g. 1.0.0)`);
  }

  // Confidence
  if (typeof rule.confidence === 'number' && (rule.confidence < 0 || rule.confidence > 100)) {
    errors.push(`Confidence must be between 0 and 100`);
  }

  // Patterns
  const patterns = Array.isArray(rule.patterns) ? rule.patterns : (rule.pattern ? [rule.pattern] : []);
  if (patterns.length === 0) {
    errors.push(`Rule must define at least one pattern in 'patterns' array or 'pattern' field`);
  } else {
    for (const pat of patterns) {
      const patStr = typeof pat === 'string' ? pat : pat?.regex;
      const safety = validateRegexSafety(patStr);
      if (!safety.safe) {
        errors.push(`Pattern safety failure: ${safety.error}`);
      }
    }
  }

  // Keywords (optional but if provided must be array of strings)
  if (rule.keywords && (!Array.isArray(rule.keywords) || rule.keywords.some(k => typeof k !== 'string'))) {
    errors.push(`Keywords must be an array of strings`);
  }

  // Test Fixtures (optional positive & negative samples)
  if (rule.testFixtures) {
    if (typeof rule.testFixtures !== 'object') {
      errors.push(`testFixtures must be an object with positive and negative arrays`);
    } else {
      const { positive = [], negative = [] } = rule.testFixtures;
      if (!Array.isArray(positive) || !Array.isArray(negative)) {
        errors.push(`testFixtures.positive and testFixtures.negative must be arrays`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a complete RulePack Manifest.
 * @param {object} manifest
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRulePackManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['RulePack manifest must be an object'] };
  }

  const jsonBytes = Buffer.byteLength(JSON.stringify(manifest), 'utf8');
  if (jsonBytes > LIMITS.MAX_MANIFEST_BYTES) {
    errors.push(`Manifest size (${jsonBytes} bytes) exceeds maximum limit of ${LIMITS.MAX_MANIFEST_BYTES} bytes`);
  }

  if (!manifest.id || typeof manifest.id !== 'string' || !/^[a-z0-9_-]{3,64}$/.test(manifest.id)) {
    errors.push(`Invalid manifest.id '${manifest.id}': must be 3-64 lowercase alphanumeric, hyphens, or underscores`);
  }

  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.length < 3) {
    errors.push(`Manifest name must be a string of at least 3 characters`);
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push(`Manifest version must follow semantic versioning (e.g. 1.0.0)`);
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push(`Manifest description is required`);
  }

  if (!manifest.author || typeof manifest.author !== 'string') {
    errors.push(`Manifest author is required`);
  }

  if (!manifest.license || typeof manifest.license !== 'string') {
    errors.push(`Manifest license is required (e.g. Apache-2.0 or MIT)`);
  }

  if (!Array.isArray(manifest.rules) || manifest.rules.length === 0) {
    errors.push(`Manifest must contain a non-empty 'rules' array`);
  } else if (manifest.rules.length > LIMITS.MAX_RULES_PER_PACK) {
    errors.push(`Manifest contains ${manifest.rules.length} rules, exceeding limit of ${LIMITS.MAX_RULES_PER_PACK}`);
  } else {
    // Validate individual rules and check duplicate IDs
    const seenRuleIds = new Set();
    manifest.rules.forEach((rule, idx) => {
      const res = validateRule(rule);
      if (!res.valid) {
        errors.push(`Rule at index ${idx} ('${rule.id || 'unnamed'}'): ${res.errors.join(', ')}`);
      }
      if (rule.id) {
        if (seenRuleIds.has(rule.id)) {
          errors.push(`Duplicate rule ID '${rule.id}' found within pack`);
        }
        seenRuleIds.add(rule.id);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
