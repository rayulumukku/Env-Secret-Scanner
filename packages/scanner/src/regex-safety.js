/**
 * lib/scanner/regex-safety.js
 *
 * ReDoS Protection & Custom Regex Validation Engine.
 * Protects SecretShield against catastrophic backtracking, ReDoS attacks,
 * oversized patterns, and infinite execution loops.
 *
 * SECURITY:
 *   - Strictly validates user-submitted regex patterns before execution.
 *   - Enforces pattern length limits (<500 chars).
 *   - Detects nested quantifiers and dangerous repetition constructs.
 */

export const MAX_PATTERN_LENGTH = 500;
export const MAX_REGEX_EXECUTION_MS = 3000;

// Patterns that frequently trigger exponential / polynomial backtracking
const DANGEROUS_PATTERNS = [
  /\([^)]*(\+|\*|\{[0-9]+,\})\)[+*]/,          // Nested quantifiers: (a+)+ or (a*)*
  /\([^)]*(\+|\*)\)\{[0-9]+,\}/,               // (a+){2,}
  /(\[[^\]]+\]\+|\.\+)\1+/,                    // Repeating overlapping character classes: ([a-z]+)+
  /\((?:[^()]+|\([^()]*\))*\)\s*[*+]\s*\+/,    // Overlapping quantifiers with plus: ((a+)*)+
];

/**
 * Validate that a regex pattern is safe to execute and does not cause ReDoS.
 *
 * @param {string} pattern - regex pattern string
 * @param {string} [flags='g'] - regex flags
 * @returns {{ valid: boolean, error?: string, safeRegex?: RegExp }}
 */
export function validateRegexSafety(pattern = '', flags = 'g') {
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'Pattern cannot be empty.' };
  }

  // 1. Length validation
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      valid: false,
      error: `Pattern exceeds maximum allowed length (${MAX_PATTERN_LENGTH} characters).`,
    };
  }

  // 2. Syntax compilation check
  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    return {
      valid: false,
      error: `Invalid regular expression syntax: ${err.message}`,
    };
  }

  // 3. Catastrophic backtracking static heuristic
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return {
        valid: false,
        error: 'Dangerous regex structure detected: nested quantifiers (e.g. (a+)+) can cause catastrophic backtracking (ReDoS).',
      };
    }
  }

  // 4. Runtime timeout check against adversarial payload
  const adversarialProbe = 'a'.repeat(30) + '!';
  const start = Date.now();
  try {
    regex.test(adversarialProbe);
    const duration = Date.now() - start;
    if (duration > 50) {
      return {
        valid: false,
        error: 'Regex execution time exceeded safety limits on adversarial input test.',
      };
    }
  } catch {
    return { valid: false, error: 'Regex execution failed during safety check.' };
  }

  return { valid: true, safeRegex: regex };
}

/**
 * Safely execute a regex against content with timeout guard.
 *
 * @param {RegExp} regex
 * @param {string} content
 * @param {number} [timeoutMs=MAX_REGEX_EXECUTION_MS]
 * @returns {Array<RegExpExecArray>}
 */
export function safeRegexExec(regex, content = '', timeoutMs = MAX_REGEX_EXECUTION_MS) {
  const matches = [];
  const start = Date.now();
  const re = new RegExp(regex.source, regex.flags);

  let match;
  while ((match = re.exec(content)) !== null) {
    if (Date.now() - start > timeoutMs) {
      break; // Abort on execution timeout to prevent DoS
    }
    matches.push(match);

    // Guard against zero-width match infinite loops
    if (match.index === re.lastIndex) {
      re.lastIndex++;
    }
  }

  return matches;
}
