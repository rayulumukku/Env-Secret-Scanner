/**
 * lib/formatters/sarif.js
 *
 * SARIF 2.1.0 output formatter.
 *
 * Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
 *
 * Security:
 *   - Raw secret values NEVER appear in SARIF output
 *   - Only maskedValue is included in result messages
 *   - All string fields are sanitized
 */

const SARIF_VERSION = '2.1.0';
const SARIF_SCHEMA  = 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json';
const TOOL_NAME     = 'SecretShield';
const TOOL_VERSION  = '2.0.0';
const TOOL_URI      = 'https://github.com/rayulumukku/Env-Secret-Scanner';

// Map SecretShield severities to SARIF levels
const SEVERITY_TO_SARIF = {
  CRITICAL: 'error',
  HIGH:     'error',
  MEDIUM:   'warning',
  LOW:      'note',
};

// Map to SARIF security-severity (CVSS-like 0-10 scale)
const SEVERITY_TO_SECURITY = {
  CRITICAL: '9.5',
  HIGH:     '7.5',
  MEDIUM:   '4.5',
  LOW:      '2.0',
};

// ── RULE DEFINITIONS ──────────────────────────────────────────────────────────

function buildRules(findings) {
  const ruleMap = new Map();

  for (const finding of findings) {
    const ruleId = sanitize(finding.ruleId || finding.rule || finding.type || 'SECRET-GENERIC');

    if (ruleMap.has(ruleId)) continue;

    ruleMap.set(ruleId, {
      id: ruleId,
      name: sanitize(finding.type || 'GenericSecret'),
      shortDescription: {
        text: sanitize(finding.description || finding.type || 'Secret detected'),
      },
      fullDescription: {
        text: sanitize(
          `SecretShield detected a potentially exposed ${finding.type || 'secret'}. ` +
          `Category: ${finding.category || 'Unknown'}. ` +
          `Severity: ${finding.severity || 'UNKNOWN'}. ` +
          `Rotate this credential immediately if it is real.`
        ),
      },
      helpUri: TOOL_URI,
      properties: {
        tags:            ['security', 'secret-detection'],
        precision:       'medium',
        'problem.severity': (SEVERITY_TO_SARIF[finding.severity] || 'warning'),
        'security-severity': (SEVERITY_TO_SECURITY[finding.severity] || '4.5'),
      },
    });
  }

  return Array.from(ruleMap.values());
}

// ── RESULTS ───────────────────────────────────────────────────────────────────

function buildResults(findings) {
  return findings.map(finding => {
    const ruleId  = sanitize(finding.ruleId || finding.rule || finding.type || 'SECRET-GENERIC');
    const level   = SEVERITY_TO_SARIF[finding.severity] || 'warning';
    const message = buildMessage(finding);

    const result = {
      ruleId,
      level,
      message: { text: message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: sanitizeUri(finding.file || 'unknown'),
              uriBaseId: '%SRCROOT%',
            },
            region: {
              startLine:   Math.max(1, parseInt(finding.line, 10) || 1),
              startColumn: Math.max(1, parseInt(finding.column, 10) || 1),
            },
          },
        },
      ],
      properties: {
        confidence:     finding.confidence !== undefined ? finding.confidence : null,
        category:       sanitize(finding.category || 'unknown'),
        fingerprint:    finding.fingerprint || null,
        maskedValue:    finding.maskedValue || null,
        severity:       finding.severity    || null,
        // NOTE: rawValue is intentionally excluded
      },
    };

    // Add fingerprint for deduplication
    if (finding.fingerprint) {
      result.fingerprints = {
        'secretshield/v1': finding.fingerprint,
      };
    }

    return result;
  });
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

/**
 * Generate SARIF 2.1.0 document from findings.
 *
 * @param {object[]} findings   - from scanner engine (masked)
 * @param {object}   options
 * @param {string}   [options.repoUri]   - URI of the repository being scanned
 * @param {string}   [options.commitSha] - commit hash for the scan
 * @returns {string} SARIF JSON string
 */
export function toSarif(findings, options = {}) {
  const rules   = buildRules(findings);
  const results = buildResults(findings);

  const sarif = {
    $schema: SARIF_SCHEMA,
    version: SARIF_VERSION,
    runs: [
      {
        tool: {
          driver: {
            name:            TOOL_NAME,
            version:         TOOL_VERSION,
            informationUri:  TOOL_URI,
            rules,
          },
        },
        results,
        columnKind: 'utf16CodeUnits',
        ...(options.repoUri ? {
          versionControlProvenance: [{
            repositoryUri: sanitizeUri(options.repoUri),
            revisionId:    options.commitSha || null,
          }],
        } : {}),
        properties: {
          scanDate:   new Date().toISOString(),
          totalFound: findings.length,
          tool:       TOOL_NAME,
        },
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Validate that a SARIF document has the required structure.
 * @param {string|object} sarifInput - SARIF JSON string or parsed object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSarif(sarifInput) {
  const errors = [];

  let sarif;
  if (typeof sarifInput === 'string') {
    try {
      sarif = JSON.parse(sarifInput);
    } catch (e) {
      return { valid: false, errors: [`Invalid JSON: ${e.message}`] };
    }
  } else {
    sarif = sarifInput;
  }

  if (sarif.version !== SARIF_VERSION)         errors.push(`Expected version ${SARIF_VERSION}`);
  if (!Array.isArray(sarif.runs))              errors.push('Missing runs array');
  if (!sarif.runs?.[0]?.tool?.driver?.name)   errors.push('Missing tool.driver.name');
  if (!Array.isArray(sarif.runs?.[0]?.results)) errors.push('Missing results array');

  // Security: ensure no result has a rawValue
  for (const result of (sarif.runs?.[0]?.results || [])) {
    if (result.properties?.rawValue) {
      errors.push('SECURITY: rawValue found in SARIF output — this must be removed');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  // Remove control characters, truncate
  return str.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 500);
}

function sanitizeUri(uri) {
  if (typeof uri !== 'string') return 'unknown';
  // Replace backslashes with forward slashes (Windows paths)
  return uri.replace(/\\/g, '/').replace(/[\x00-\x1f]/g, '').slice(0, 1000);
}

function buildMessage(finding) {
  // SECURITY: Use maskedValue only — never rawValue
  const masked = finding.maskedValue ? ` Value: ${finding.maskedValue}.` : '';
  const conf   = finding.confidence !== undefined ? ` Confidence: ${finding.confidence}%.` : '';

  return sanitize(
    `${finding.description || finding.type || 'Secret detected'} detected in ${finding.file || 'unknown'}.${masked}${conf} ` +
    `Rotate this credential immediately if it is real.`
  );
}
