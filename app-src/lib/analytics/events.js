/**
 * lib/analytics/events.js
 *
 * Safe, privacy-conscious event types for SecretShield product telemetry.
 *
 * CRITICAL SECURITY INVARIANT:
 * NEVER track:
 * - secret values
 * - source code
 * - repository contents
 * - tokens or passwords
 * - OAuth credentials
 * - raw file paths if they could reveal sensitive information
 */

export const ANALYTICS_EVENTS = {
  SIGNUP_COMPLETED:       'signup_completed',
  ORGANIZATION_CREATED:   'organization_created',
  PROJECT_CREATED:        'project_created',
  REPOSITORY_CONNECTED:   'repository_connected',
  SCAN_STARTED:           'scan_started',
  SCAN_COMPLETED:         'scan_completed',
  FINDING_CREATED:        'finding_created',
  FINDING_RESOLVED:       'finding_resolved',
  PR_CREATED:             'pr_created',
  POLICY_ENABLED:         'policy_enabled',
  INTEGRATION_CONNECTED:  'integration_connected',
  DOCUMENTATION_VIEWED:   'documentation_viewed',
  TOUR_COMPLETED:         'tour_completed',
  FEEDBACK_SUBMITTED:     'feedback_submitted',
};

export const ALLOWED_EVENT_NAMES = new Set(Object.values(ANALYTICS_EVENTS));
