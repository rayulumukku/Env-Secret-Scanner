/**
 * lib/remediation/providers.js
 *
 * Provider knowledge base for secret remediation.
 * Contains verified documentation links, provider classifications, and remediation types.
 *
 * NOTE: Does NOT claim SecretShield can automatically rotate/revoke credentials unless
 * real provider credentials and APIs exist.
 */

export const PROVIDER_METADATA = {
  AWS: {
    name: 'Amazon Web Services (AWS)',
    category: 'Cloud Infrastructure',
    icon: 'aws',
    documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_RotateAccessKey',
    consoleUrl: 'https://console.aws.amazon.com/iamv2/home#/users',
    remediationType: 'ROTATE_IAM_CREDENTIAL',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Deactivate the exposed Access Key ID in the AWS IAM Console.',
      'Generate a new Access Key ID and Secret Access Key.',
      'Store replacement credentials in AWS Secrets Manager or environment variables.',
      'Delete the compromised key after confirming new key functionality.',
      'Review AWS CloudTrail logs for unauthorized API activity during the exposure window.',
    ],
  },
  GITHUB: {
    name: 'GitHub',
    category: 'Source Control & CI/CD',
    icon: 'github',
    documentationUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
    consoleUrl: 'https://github.com/settings/tokens',
    remediationType: 'REVOKE_PAT',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Revoke the compromised Personal Access Token or OAuth token immediately.',
      'Generate a new Fine-Grained Personal Access Token with minimal repository scopes.',
      'Update GitHub Actions secrets or environment variables in dependent pipelines.',
      'Review your GitHub security log for unfamiliar API requests.',
    ],
  },
  GOOGLE: {
    name: 'Google Cloud Platform (GCP)',
    category: 'Cloud Infrastructure',
    icon: 'google',
    documentationUrl: 'https://cloud.google.com/docs/authentication/api-keys#managing_api_keys',
    consoleUrl: 'https://console.cloud.google.com/apis/credentials',
    remediationType: 'ROTATE_SERVICE_ACCOUNT_KEY',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Restrict or delete the exposed API key or Service Account key in Google Cloud Console.',
      'Create a replacement key with strict API restrictions and IP/HTTP referrer restrictions.',
      'Deploy the new credential via GCP Secret Manager.',
      'Inspect Cloud Audit Logs for anomalous operations.',
    ],
  },
  OPENAI: {
    name: 'OpenAI',
    category: 'AI Services',
    icon: 'openai',
    documentationUrl: 'https://platform.openai.com/docs/quickstart',
    consoleUrl: 'https://platform.openai.com/api-keys',
    remediationType: 'ROTATE_API_KEY',
    riskLevel: 'HIGH',
    defaultSlaHours: { CRITICAL: 6, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Delete the exposed API key in the OpenAI Dashboard.',
      'Create a new Project-Scoped Secret Key.',
      'Configure spend limits and alerts on your OpenAI organization account.',
      'Verify usage logs in the OpenAI dashboard.',
    ],
  },
  STRIPE: {
    name: 'Stripe',
    category: 'Payments & Billing',
    icon: 'stripe',
    documentationUrl: 'https://stripe.com/docs/keys#rolling-keys',
    consoleUrl: 'https://dashboard.stripe.com/apikeys',
    remediationType: 'ROLL_API_KEY',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 2, HIGH: 12, MEDIUM: 48, LOW: 168 },
    bestPractices: [
      'Roll the compromised Secret Key in the Stripe Developers Dashboard.',
      'Utilize Stripe Restricted Keys with granular permissions instead of root secret keys.',
      'Update backend environment configuration before the grace period expires.',
      'Review Stripe Dashboard Event logs for unexpected charges or payout updates.',
    ],
  },
  SLACK: {
    name: 'Slack',
    category: 'Team Communication',
    icon: 'slack',
    documentationUrl: 'https://api.slack.com/authentication/token-types',
    consoleUrl: 'https://api.slack.com/apps',
    remediationType: 'REVOKE_BOT_TOKEN',
    riskLevel: 'HIGH',
    defaultSlaHours: { CRITICAL: 6, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Reinstall the Slack App or regenerate the bot/user token (`xoxb-` / `xoxp-`).',
      'If an Incoming Webhook was exposed, delete the webhook URL and generate a replacement.',
      'Review installed app permissions and channel history.',
    ],
  },
  NPM: {
    name: 'npm Registry',
    category: 'Package Management',
    icon: 'npm',
    documentationUrl: 'https://docs.npmjs.com/about-access-tokens',
    consoleUrl: 'https://www.npmjs.com/settings/tokens',
    remediationType: 'REVOKE_NPM_TOKEN',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Revoke the token using `npm token revoke <token-key>` or via the npmjs web interface.',
      'Generate a Granular Access Token restricted to specific packages with 2FA requirement for publishing.',
      'Audit your published packages to ensure no unauthorized versions were released.',
    ],
  },
  DATABASE: {
    name: 'Database (PostgreSQL / MySQL / MongoDB / Redis)',
    category: 'Data Storage',
    icon: 'database',
    documentationUrl: 'https://www.postgresql.org/docs/current/sql-alterrole.html',
    consoleUrl: null,
    remediationType: 'ROTATE_DB_PASSWORD',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Alter the user password in your database server (`ALTER ROLE username WITH PASSWORD \'new_password\';`).',
      'Update database connection strings across environment variables / Kubernetes Secrets.',
      'Verify that application services reconnect successfully.',
      'Check database access logs for connections from unauthorized IP addresses.',
    ],
  },
  PRIVATE_KEY: {
    name: 'Cryptographic Private Key (RSA / OpenSSH)',
    category: 'Cryptography & SSH',
    icon: 'key',
    documentationUrl: 'https://www.ssh.com/academy/ssh/keygen',
    consoleUrl: null,
    remediationType: 'REPLACE_KEYPAIR',
    riskLevel: 'CRITICAL',
    defaultSlaHours: { CRITICAL: 2, HIGH: 12, MEDIUM: 48, LOW: 168 },
    bestPractices: [
      'Generate a new SSH or RSA keypair with modern algorithms (e.g. `ssh-keygen -t ed25519`).',
      'Remove the compromised public key from `~/.ssh/authorized_keys` and server configurations.',
      'Deploy the new public key to required hosts.',
      'Review server authentication logs (`/var/log/auth.log` or `/var/log/secure`).',
    ],
  },
  GENERIC: {
    name: 'Generic Credential / Password',
    category: 'Credentials & Passwords',
    icon: 'lock',
    documentationUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
    consoleUrl: null,
    remediationType: 'CHANGE_PASSWORD',
    riskLevel: 'HIGH',
    defaultSlaHours: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 168 },
    bestPractices: [
      'Change the exposed password or credential on the target system.',
      'Migrate credentials to an enterprise password manager or vault.',
      'Remove hardcoded values from source code and replace with environment variables.',
      'Review Git history for previous versions containing the password.',
    ],
  },
};

/**
 * Identify the provider for a given finding based on ruleId, category, or type.
 *
 * @param {object} finding
 * @returns {object} Provider metadata
 */
export function getProviderForFinding(finding = {}) {
  const text = `${finding.ruleId || ''} ${finding.type || ''} ${finding.category || ''}`.toLowerCase();

  if (text.includes('aws')) return PROVIDER_METADATA.AWS;
  if (text.includes('github') || text.includes('ghp_') || text.includes('gho_')) return PROVIDER_METADATA.GITHUB;
  if (text.includes('google') || text.includes('gcp') || text.includes('firebase')) return PROVIDER_METADATA.GOOGLE;
  if (text.includes('openai') || text.includes('sk-proj')) return PROVIDER_METADATA.OPENAI;
  if (text.includes('stripe') || text.includes('sk_live') || text.includes('sk_test')) return PROVIDER_METADATA.STRIPE;
  if (text.includes('slack') || text.includes('xoxb') || text.includes('xoxp')) return PROVIDER_METADATA.SLACK;
  if (text.includes('npm')) return PROVIDER_METADATA.NPM;
  if (text.includes('postgres') || text.includes('mongo') || text.includes('redis') || text.includes('mysql') || text.includes('database')) return PROVIDER_METADATA.DATABASE;
  if (text.includes('private key') || text.includes('rsa') || text.includes('openssh')) return PROVIDER_METADATA.PRIVATE_KEY;

  return PROVIDER_METADATA.GENERIC;
}
