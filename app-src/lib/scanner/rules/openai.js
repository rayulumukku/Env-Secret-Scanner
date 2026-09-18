/**
 * OpenAI API key detection rules.
 */

import { maskSecret } from '../masking.js';

const OPENAI_RULES = [
  {
    name: 'OpenAI API Key (Project)',
    type: 'OPENAI_PROJECT_KEY',
    category: 'AI/ML Services',
    pattern: /\bsk-proj-[A-Za-z0-9_\-]{40,100}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'OpenAI project-scoped API key detected. Can be used to make paid API calls.',
    remediation: 'Revoke at platform.openai.com/api-keys. Check usage dashboard for unauthorized charges.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'OpenAI API Key (Legacy)',
    type: 'OPENAI_LEGACY_KEY',
    category: 'AI/ML Services',
    pattern: /\bsk-[A-Za-z0-9]{48}\b/g,
    severity: 'CRITICAL',
    confidence: 95,
    description: 'OpenAI API key detected. Grants access to GPT models and may incur billing.',
    remediation: 'Revoke at platform.openai.com/api-keys immediately.',
    maskOptions: { showPrefix: 5, showSuffix: 4 },
  },
  {
    name: 'OpenAI Organization ID',
    type: 'OPENAI_ORG_ID',
    category: 'AI/ML Services',
    pattern: /\borg-[A-Za-z0-9]{24}\b/g,
    severity: 'LOW',
    confidence: 70,
    description: 'OpenAI Organization ID detected. Not a secret by itself but should not be exposed.',
    remediation: 'Remove from source code. Use environment variables.',
    maskOptions: { showPrefix: 5, showSuffix: 4 },
  },
];

/**
 * Detect OpenAI credentials in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of OPENAI_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = match[0];

      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      const maskedValue = maskSecret(rawValue, rule.maskOptions);

      findings.push({
        type: rule.type,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        line,
        column,
        file: filename,
        maskedValue,
        description: rule.description,
        remediation: rule.remediation,
        lineContent: lines[line - 1] || '',
      });
    }
  }

  return findings;
}
