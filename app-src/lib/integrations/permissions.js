/**
 * @file lib/integrations/permissions.js
 * @description Integration permission scopes, declarative boundaries, and explanation models.
 * 
 * TRANSPARENT PERMISSION PRINCIPLE:
 *   - Only request permissions strictly necessary for scanning and gating.
 *   - Clearly state what SecretShield accesses, why, and what it NEVER accesses.
 */

export const INTEGRATION_PERMISSIONS = {
  github: {
    read: [
      { scope: 'Repository metadata', reason: 'To identify repository name, default branch, and visibility' },
      { scope: 'Pull request diffs', reason: 'To scan changed files in pull requests before merge' },
      { scope: 'Commit contents', reason: 'To analyze git commits for credential additions' }
    ],
    write: [
      { scope: 'Checks & statuses', reason: 'To post pass/fail security status checks on pull requests' },
      { scope: 'PR review comments', reason: 'To leave targeted comments on lines containing flagged secrets' }
    ],
    events: [
      { event: 'push', reason: 'Trigger scans on new commit pushes' },
      { event: 'pull_request', reason: 'Trigger scans on PR creation and updates' }
    ],
    neverAccesses: [
      'Account billing or payment methods',
      'Personal email or profile settings',
      'Unrelated organization repositories',
      'Repository administration / deletion'
    ]
  },
  gitlab: {
    read: [
      { scope: 'Project metadata', reason: 'To identify GitLab project details and branches' },
      { scope: 'Merge request diffs', reason: 'To audit merge requests before integration' }
    ],
    write: [
      { scope: 'Pipeline status', reason: 'To update commit and pipeline status indicators' },
      { scope: 'Discussion notes', reason: 'To post inline remediation suggestions' }
    ],
    events: [
      { event: 'Push Hook', reason: 'Trigger scan on push' },
      { event: 'Merge Request Hook', reason: 'Trigger scan on merge request' }
    ],
    neverAccesses: [
      'GitLab administrative keys',
      'SSH deploy keys',
      'Organization billing'
    ]
  },
  slack: {
    read: [
      { scope: 'Public channel list', reason: 'To let administrators choose the security alert destination channel' }
    ],
    write: [
      { scope: 'Incoming webhook messages', reason: 'To dispatch critical finding notifications and scan alerts' }
    ],
    events: [
      { event: 'finding.critical', reason: 'Send instant alert when critical secret is detected' }
    ],
    neverAccesses: [
      'User direct messages (DMs)',
      'Channel chat history or message archives',
      'File attachments in channels'
    ]
  },
  webhooks: {
    read: [],
    write: [
      { scope: 'HTTP POST delivery', reason: 'To deliver HMAC-SHA256 signed JSON payloads to your endpoint' }
    ],
    events: [
      { event: 'Configured security events', reason: 'Selected by organization administrators' }
    ],
    neverAccesses: [
      'Your internal server credentials',
      'Database connection strings',
      'Unencrypted payloads'
    ]
  }
};

/**
 * Returns declarative permissions for an integration.
 * 
 * @param {string} integrationId 
 * @returns {Object} Permission details
 */
export function getIntegrationPermissions(integrationId) {
  return INTEGRATION_PERMISSIONS[integrationId] || {
    read: [],
    write: [],
    events: [],
    neverAccesses: ['All sensitive account data']
  };
}
