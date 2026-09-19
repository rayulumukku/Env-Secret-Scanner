/**
 * rules/openai.js — OpenAI API key detection.
 */

export const RULES = [
  {
    id: 'OPENAI_API_KEY_PROJECT',
    name: 'OpenAI Project API Key',
    type: 'OPENAI_API_KEY_PROJECT',
    category: 'AI Services',
    // sk-proj- prefix, 48+ chars
    pattern: /\bsk-proj-[A-Za-z0-9\-_]{48,}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'OpenAI project-scoped API key. Grants access to OpenAI APIs and incurs billing.',
    remediation: 'Revoke at https://platform.openai.com/api-keys and rotate all dependent systems.',
  },
  {
    id: 'OPENAI_API_KEY_LEGACY',
    name: 'OpenAI API Key (Legacy)',
    type: 'OPENAI_API_KEY_LEGACY',
    category: 'AI Services',
    // sk- prefix, not sk-proj, 48 chars
    pattern: /\bsk-(?!proj-)[A-Za-z0-9]{48}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 5, showSuffix: 4 },
    description: 'OpenAI legacy API key. Grants full access to OpenAI APIs.',
    remediation: 'Revoke at https://platform.openai.com/api-keys and replace with project-scoped keys.',
  },
  {
    id: 'OPENAI_ORG_KEY',
    name: 'OpenAI Organization Key',
    type: 'OPENAI_ORG_KEY',
    category: 'AI Services',
    pattern: /\bsk-org-[A-Za-z0-9\-_]{32,}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'OpenAI organization-level API key.',
    remediation: 'Revoke immediately at https://platform.openai.com/api-keys.',
  },
];

export { RULES as rules };
