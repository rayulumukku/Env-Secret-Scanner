/**
 * lib/remediation/templates.js
 *
 * Standardized checklist templates and remediation instructions.
 */

export const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    id: 'revoke_provider',
    label: 'Revoke or disable the compromised credential in the provider dashboard',
    description: 'Log into the provider console (e.g. AWS IAM, GitHub, Stripe) and deactivate the exposed key.',
    required: true,
  },
  {
    id: 'create_replacement',
    label: 'Generate a replacement credential with least-privilege permissions',
    description: 'Create a new key or token restricted to only the necessary services and environments.',
    required: true,
  },
  {
    id: 'update_app_config',
    label: 'Update application configuration and deployment environment variables',
    description: 'Store the replacement secret securely in a vault, secrets manager, or environment config.',
    required: true,
  },
  {
    id: 'clean_source',
    label: 'Remove hardcoded secret from current source code and commit changes',
    description: 'Replace the hardcoded string with reference to process.env or secret accessor.',
    required: true,
  },
  {
    id: 'review_history',
    label: 'Review Git history and remove historical commits if necessary',
    description: 'If pushed to a public or shared branch, rewrite Git history or consider the old secret permanently compromised.',
    required: false,
  },
  {
    id: 'rescan_repository',
    label: 'Trigger SecretShield rescan to verify the secret is no longer detected',
    description: 'Click "Rescan Repository" in SecretShield to ensure the fingerprint has vanished from the active branch.',
    required: true,
  },
  {
    id: 'verify_deployment',
    label: 'Verify application connectivity and production health',
    description: 'Test that application services function normally with the replacement credential.',
    required: true,
  },
];

/**
 * Generate standard checklist tasks with completion tracking.
 */
export function buildInitialChecklist(customTasks = []) {
  const base = DEFAULT_CHECKLIST_TEMPLATE.map(t => ({
    ...t,
    completed: false,
    completedAt: null,
    completedBy: null,
  }));

  if (customTasks.length > 0) {
    base.push(...customTasks.map(ct => ({
      ...ct,
      completed: false,
      completedAt: null,
      completedBy: null,
    })));
  }

  return base;
}
