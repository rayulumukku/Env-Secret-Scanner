/**
 * @file lib/integrations/manifest.js
 * @description Manifest registry declaring supported and planned integrations.
 * 
 * FACTUAL INTEGRATIONS PRINCIPLE:
 *   - Only mark integrations as SUPPORTED if real connection adapters exist.
 *   - Planned integrations are explicitly labeled as COMING_SOON ("Coming later").
 *   - No fake connection buttons for unsupported providers.
 */

export const IntegrationCategory = Object.freeze({
  SOURCE_CONTROL: 'Source Control',
  CI_CD: 'CI/CD',
  COMMUNICATION: 'Communication',
  ISSUE_TRACKING: 'Issue Tracking',
  OBSERVABILITY: 'Observability',
  DEVELOPER_TOOLS: 'Developer Tools',
  IDENTITY: 'Identity & Access',
  WEBHOOKS: 'Webhooks'
});

export const IntegrationStatus = Object.freeze({
  SUPPORTED: 'SUPPORTED',
  COMING_SOON: 'COMING_SOON'
});

export const INTEGRATION_MANIFESTS = [
  // ── 1. ACTIVE & SUPPORTED INTEGRATIONS ────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    slug: 'github',
    description: 'Automatic push and pull request scanning with GitHub Checks, PR comments, and GitHub Actions integration.',
    category: IntegrationCategory.SOURCE_CONTROL,
    status: IntegrationStatus.SUPPORTED,
    icon: 'GitBranch',
    badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
    website: 'https://github.com',
    docsPath: '/docs/github-protection',
    capabilities: [
      'Pull request diff scanning',
      'Commit push inspection',
      'GitHub Check Runs gating',
      'Automated PR review comments'
    ],
    supportedEvents: [
      'push',
      'pull_request.opened',
      'pull_request.synchronize',
      'check_suite.requested'
    ]
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    slug: 'gitlab',
    description: 'Webhook-driven secret scanning for GitLab pushes, merge requests, and GitLab CI/CD pipeline integration.',
    category: IntegrationCategory.SOURCE_CONTROL,
    status: IntegrationStatus.SUPPORTED,
    icon: 'GitPullRequest',
    badgeColor: 'text-orange-400 bg-orange-950/60 border-orange-800',
    website: 'https://gitlab.com',
    docsPath: '/docs/integrations/editor',
    capabilities: [
      'Merge request diff scanning',
      'Push event hooks',
      'Pipeline status notifications',
      'GitLab CI job gate'
    ],
    supportedEvents: [
      'Push Hook',
      'Merge Request Hook',
      'Pipeline Hook'
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    slug: 'slack',
    description: 'Real-time team notifications for critical findings, pipeline scan failures, and remediation resolution updates.',
    category: IntegrationCategory.COMMUNICATION,
    status: IntegrationStatus.SUPPORTED,
    icon: 'MessageSquare',
    badgeColor: 'text-pink-400 bg-pink-950/60 border-pink-800',
    website: 'https://slack.com',
    docsPath: '/integrations/slack',
    capabilities: [
      'Critical finding instant alerts',
      'Scan failure warnings',
      'Weekly security digests',
      'Granular per-channel routing'
    ],
    supportedEvents: [
      'finding.critical',
      'scan.failed',
      'remediation.resolved',
      'policy.violation'
    ]
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    slug: 'webhooks',
    description: 'Cryptographically signed HMAC-SHA256 event payloads dispatched to your internal security pipelines and SIEM systems.',
    category: IntegrationCategory.WEBHOOKS,
    status: IntegrationStatus.SUPPORTED,
    icon: 'Webhook',
    badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    website: 'https://secretshield.dev/docs/webhooks',
    docsPath: '/settings/webhooks',
    capabilities: [
      'HMAC-SHA256 signature verification',
      'Configurable event subscription',
      'Exponential backoff delivery retry',
      'Secret key rotation'
    ],
    supportedEvents: [
      'finding.created',
      'finding.critical',
      'finding.resolved',
      'scan.completed',
      'scan.failed',
      'pr.scan.completed',
      'policy.violation'
    ]
  },

  // ── 2. PLANNED / COMING LATER INTEGRATIONS ────────────────────────────────
  {
    id: 'discord',
    name: 'Discord',
    slug: 'discord',
    description: 'Developer community and engineering channel alerts for secret exposure events.',
    category: IntegrationCategory.COMMUNICATION,
    status: IntegrationStatus.COMING_SOON,
    icon: 'MessageSquare',
    badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
    capabilities: ['Channel alerts', 'Threaded finding triage']
  },
  {
    id: 'msteams',
    name: 'Microsoft Teams',
    slug: 'msteams',
    description: 'Enterprise adaptive cards and webhook notifications for Microsoft 365 organizations.',
    category: IntegrationCategory.COMMUNICATION,
    status: IntegrationStatus.COMING_SOON,
    icon: 'MessageSquare',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
    capabilities: ['Adaptive cards', 'Security team channel broadcast']
  },
  {
    id: 'jira',
    name: 'Jira Software',
    slug: 'jira',
    description: 'Automated vulnerability issue creation, sprint tracking, and SLA escalation for secret remediation.',
    category: IntegrationCategory.ISSUE_TRACKING,
    status: IntegrationStatus.COMING_SOON,
    icon: 'CheckSquare',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
    capabilities: ['Auto-create security tickets', 'Bidirectional status sync']
  },
  {
    id: 'linear',
    name: 'Linear',
    slug: 'linear',
    description: 'Seamless engineering task creation and triage for findings identified in pull requests.',
    category: IntegrationCategory.ISSUE_TRACKING,
    status: IntegrationStatus.COMING_SOON,
    icon: 'CheckSquare',
    badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
    capabilities: ['Issue creation', 'Project linkage']
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    slug: 'bitbucket',
    description: 'Bitbucket Server and Cloud repository scanning with Bitbucket Pipelines gating.',
    category: IntegrationCategory.SOURCE_CONTROL,
    status: IntegrationStatus.COMING_SOON,
    icon: 'GitBranch',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
    capabilities: ['Pull request scanning', 'Bitbucket Pipelines check']
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    slug: 'circleci',
    description: 'CircleCI orb for fast, zero-cloud secret scanning in build workflows.',
    category: IntegrationCategory.CI_CD,
    status: IntegrationStatus.COMING_SOON,
    icon: 'Terminal',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    capabilities: ['CircleCI orb', 'Workflow gate']
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    slug: 'jenkins',
    description: 'Jenkins pipeline plugin for pre-build repository audits and baseline suppression.',
    category: IntegrationCategory.CI_CD,
    status: IntegrationStatus.COMING_SOON,
    icon: 'Terminal',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    capabilities: ['Jenkinsfile step', 'Console report']
  }
];

export function getManifestById(integrationId) {
  return INTEGRATION_MANIFESTS.find(m => m.id === integrationId) || null;
}
