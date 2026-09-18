/**
 * Slack token detection rules.
 */

import { maskSecret } from '../masking.js';

const SLACK_RULES = [
  {
    name: 'Slack Bot Token',
    type: 'SLACK_BOT_TOKEN',
    category: 'Messaging & Communication',
    pattern: /\bxoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'Slack bot token detected. Can read messages, post as the bot, and access workspace data.',
    remediation: 'Revoke at api.slack.com/apps. Audit bot activity logs for unauthorized access.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Slack User Token',
    type: 'SLACK_USER_TOKEN',
    category: 'Messaging & Communication',
    pattern: /\bxoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{32}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'Slack user token detected. Acts on behalf of a real user with their full permissions.',
    remediation: 'Revoke at api.slack.com/apps. This token has the same access as the user.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Slack App-Level Token',
    type: 'SLACK_APP_TOKEN',
    category: 'Messaging & Communication',
    pattern: /\bxapp-[0-9]-[A-Za-z0-9]{10,13}-[0-9]{13}-[A-Za-z0-9]{64}\b/g,
    severity: 'HIGH',
    confidence: 97,
    description: 'Slack app-level token detected. Used for Socket Mode and other app-level APIs.',
    remediation: 'Revoke at api.slack.com/apps under "App-Level Tokens".',
    maskOptions: { showPrefix: 6, showSuffix: 4 },
  },
  {
    name: 'Slack Webhook URL',
    type: 'SLACK_WEBHOOK',
    category: 'Messaging & Communication',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_]{8,12}\/B[A-Za-z0-9_]{8,12}\/[A-Za-z0-9_]{24}\b/g,
    severity: 'HIGH',
    confidence: 98,
    description: 'Slack Incoming Webhook URL detected. Allows posting messages to a channel.',
    remediation: 'Revoke at api.slack.com/apps under "Incoming Webhooks". Generate a new one.',
    maskOptions: { showPrefix: 40, showSuffix: 4 },
  },
  {
    name: 'Slack Legacy Token',
    type: 'SLACK_LEGACY_TOKEN',
    category: 'Messaging & Communication',
    pattern: /\bxoxa-[0-9]{1,}-[0-9]{1,}-[0-9]{1,}-[A-Za-z0-9]{16,}\b/g,
    severity: 'HIGH',
    confidence: 90,
    description: 'Slack legacy workspace token detected.',
    remediation: 'Legacy tokens should be replaced with OAuth flows. Revoke immediately.',
    maskOptions: { showPrefix: 6, showSuffix: 4 },
  },
];

/**
 * Detect Slack tokens in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of SLACK_RULES) {
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
