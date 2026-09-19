/**
 * rules/slack.js — Slack credential detection.
 * Detects: Bot tokens, User tokens, App tokens, Webhook URLs, signing secrets.
 */

export const RULES = [
  {
    id: 'SLACK_BOT_TOKEN',
    name: 'Slack Bot Token',
    type: 'SLACK_BOT_TOKEN',
    category: 'Messaging',
    // xoxb- prefix
    pattern: /\bxoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Slack bot token detected. Grants API access to your Slack workspace as a bot.',
    remediation: 'Revoke at https://api.slack.com/apps and regenerate the token.',
  },
  {
    id: 'SLACK_USER_TOKEN',
    name: 'Slack User Token',
    type: 'SLACK_USER_TOKEN',
    category: 'Messaging',
    // xoxp- prefix
    pattern: /\bxoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{32}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Slack user token detected. Grants API access on behalf of a user.',
    remediation: 'Revoke at https://api.slack.com/apps. User tokens have broad permissions.',
  },
  {
    id: 'SLACK_APP_TOKEN',
    name: 'Slack App-Level Token',
    type: 'SLACK_APP_TOKEN',
    category: 'Messaging',
    // xapp- prefix
    pattern: /\bxapp-\d+-[A-Za-z0-9]+-[A-Za-z0-9]+\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Slack app-level token. Used for Socket Mode and app manifest management.',
    remediation: 'Revoke and regenerate at https://api.slack.com/apps.',
  },
  {
    id: 'SLACK_WEBHOOK_URL',
    name: 'Slack Incoming Webhook URL',
    type: 'SLACK_WEBHOOK_URL',
    category: 'Messaging',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 40, showSuffix: 4 },
    description: 'Slack incoming webhook URL. Anyone with this URL can post messages to your workspace.',
    remediation: 'Revoke the webhook in your Slack app settings and generate a new one.',
  },
  {
    id: 'SLACK_SIGNING_SECRET',
    name: 'Slack Signing Secret',
    type: 'SLACK_SIGNING_SECRET',
    category: 'Messaging',
    pattern: /(?:slack[_\-]?signing[_\-]?secret|SLACK_SIGNING_SECRET)\s*[=:]\s*["']?([a-f0-9]{32})["']?/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'Slack signing secret. Used to verify Slack requests — exposure allows request forgery.',
    remediation: 'Rotate the signing secret in your Slack app settings.',
  },
];

export { RULES as rules };
