/**
 * @file lib/policies/defaults.js
 * @description Recommended preset security policies for organizations.
 * 
 * OPT-IN PRINCIPLE:
 *   - These are provided as pre-configured recommendations ("Recommended").
 *   - Must be explicitly activated by administrators and will not silently break builds.
 */

import { PolicyScope, PolicyAction, ConditionField, ConditionOperator } from './schemas.js';

export const RECOMMENDED_POLICIES = [
  {
    id: 'rec_block_critical_pr',
    name: 'Block Critical Secrets in PRs',
    description: 'Fails pull request checks and CI runs if any Critical severity credential (such as cloud root keys or private keys) is detected.',
    scope: PolicyScope.ORGANIZATION,
    scopeId: null,
    isDefault: true,
    enabled: false, // Explicit opt-in
    conditions: [
      {
        field: ConditionField.SEVERITY,
        operator: ConditionOperator.EQUALS,
        value: 'CRITICAL'
      },
      {
        field: ConditionField.FINDING_STATUS,
        operator: ConditionOperator.IN,
        value: ['OPEN', 'CONFIRMED']
      }
    ],
    actions: [PolicyAction.FAIL_PR, PolicyAction.FAIL_CI, PolicyAction.NOTIFY]
  },
  {
    id: 'rec_warn_high_secrets',
    name: 'Warn on High Severity Credentials',
    description: 'Generates security warnings and notifications for High severity credentials (e.g. database URIs, API secret keys) without failing builds.',
    scope: PolicyScope.ORGANIZATION,
    scopeId: null,
    isDefault: true,
    enabled: false,
    conditions: [
      {
        field: ConditionField.SEVERITY,
        operator: ConditionOperator.EQUALS,
        value: 'HIGH'
      },
      {
        field: ConditionField.FINDING_STATUS,
        operator: ConditionOperator.IN,
        value: ['OPEN', 'CONFIRMED']
      }
    ],
    actions: [PolicyAction.WARN, PolicyAction.NOTIFY]
  },
  {
    id: 'rec_remediate_main_secrets',
    name: 'Active Secrets on Main Require Immediate Remediation',
    description: 'Creates automated remediation tasks and alerts security teams if high or critical secrets are active on the production default branch.',
    scope: PolicyScope.ORGANIZATION,
    scopeId: null,
    isDefault: true,
    enabled: false,
    conditions: [
      {
        field: ConditionField.SEVERITY,
        operator: ConditionOperator.IN,
        value: ['HIGH', 'CRITICAL']
      },
      {
        field: ConditionField.BRANCH,
        operator: ConditionOperator.IN,
        value: ['main', 'master']
      },
      {
        field: ConditionField.FINDING_STATUS,
        operator: ConditionOperator.EQUALS,
        value: 'OPEN'
      }
    ],
    actions: [PolicyAction.FAIL_CI, PolicyAction.CREATE_TASK, PolicyAction.NOTIFY]
  },
  {
    id: 'rec_freshness_24h',
    name: 'Repository Scan Freshness (24 Hours)',
    description: 'Warns when production repositories have not undergone a security scan in the last 24 hours.',
    scope: PolicyScope.ORGANIZATION,
    scopeId: null,
    isDefault: true,
    enabled: false,
    conditions: [
      {
        field: ConditionField.LAST_SCAN_AGE_HOURS,
        operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 24
      }
    ],
    actions: [PolicyAction.WARN, PolicyAction.NOTIFY]
  },
  {
    id: 'rec_history_audit_production',
    name: 'Historical Scan Required for Production Repositories',
    description: 'Requires a complete Git commit history audit for public or production-bound repositories.',
    scope: PolicyScope.ORGANIZATION,
    scopeId: null,
    isDefault: true,
    enabled: false,
    conditions: [
      {
        field: ConditionField.HISTORY_SCAN_STATUS,
        operator: ConditionOperator.EQUALS,
        value: 'NOT_SCANNED'
      }
    ],
    actions: [PolicyAction.WARN]
  }
];
