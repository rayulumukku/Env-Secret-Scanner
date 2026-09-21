/**
 * lib/trust/questionnaire.js
 *
 * Security Questionnaire Templates & Evidence-Backed Answer Engine for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Never automatically claims "YES" without verifiable controls or manual attribution.
 *   - Answers link directly to evidence IDs and audit timestamps.
 *   - Templates do NOT claim official external certifications.
 */

import { randomUUID } from 'crypto';

export const QUESTIONNAIRE_CATEGORIES = Object.freeze({
  ACCESS_CONTROL: 'ACCESS_CONTROL',
  AUTHENTICATION: 'AUTHENTICATION',
  ENCRYPTION: 'ENCRYPTION',
  DATA_PROTECTION: 'DATA_PROTECTION',
  INCIDENT_RESPONSE: 'INCIDENT_RESPONSE',
  LOGGING: 'LOGGING',
  RETENTION: 'RETENTION',
  BACKUPS: 'BACKUPS',
  SECURE_DEV: 'SECURE_DEV',
  VULNERABILITY_MGMT: 'VULNERABILITY_MGMT',
  INTEGRATIONS: 'INTEGRATIONS',
  AI_DATA_PROCESSING: 'AI_DATA_PROCESSING',
});

export const QUESTION_ANSWERS = Object.freeze({
  YES: 'YES',
  NO: 'NO',
  PARTIALLY: 'PARTIALLY',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

/**
 * Standard security review questions catalog across 12 categories.
 */
export const DEFAULT_QUESTIONNAIRE_TEMPLATES = [
  {
    category: QUESTIONNAIRE_CATEGORIES.AUTHENTICATION,
    title: 'Password Security & Session Management',
    question: 'Are all user passwords securely hashed using industry-standard salted algorithms, and are sessions cryptographically protected?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'SecretShield uses salted password hashing and cryptographically secure session identifiers with strict expiration.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.ACCESS_CONTROL,
    title: 'Multi-Tenant RBAC Isolation',
    question: 'Is access strictly partitioned by tenant organization, preventing cross-organization resource discovery?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Hard organizationId scoping is enforced across all database queries, API endpoints, graph traversals, and background tasks.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.DATA_PROTECTION,
    title: 'Zero Raw Secret Persistence',
    question: 'Does the application prevent storage of plaintext credentials and API tokens in databases, browser storage, or logs?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Scanner operates in-memory only. Secrets are masked with SHA-256 fingerprints immediately upon detection and raw tokens are never persisted.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.ENCRYPTION,
    title: 'Encryption in Transit',
    question: 'Is all inbound and outbound network communication encrypted using TLS 1.2 or higher?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'All web traffic and API routes require HTTPS/TLS with modern cipher suites and Strict-Transport-Security.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.LOGGING,
    title: 'Security Audit Trails',
    question: 'Are administrative changes, policy evaluations, and scan events recorded in immutable audit logs?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Audit logs capture timestamp, actor, organization, action type, and sanitized metadata for every significant state change.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.INCIDENT_RESPONSE,
    title: 'Automated Response & Approval Workflows',
    question: 'Does the system support automated incident triage and human-in-the-loop approval gates for critical security actions?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Declarative playbooks automate alerts and remediation tasks while requiring explicit approval for blocking changes.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.RETENTION,
    title: 'Data Retention & Purge Controls',
    question: 'Can administrators configure data retention timeframes and perform verifiable cleanup of stale findings?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Retention policies are configurable per tenant for findings, scans, audit logs, and evidence with scheduled automated cleanup jobs.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.AI_DATA_PROCESSING,
    title: 'AI Privacy & Offline Fallback',
    question: 'Can the security scanner operate 100% offline without sending repository source code to third-party AI models?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Core regex and entropy scanning is entirely deterministic and offline. AI enhancements are strictly optional with client-side redaction.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.BACKUPS,
    title: 'Database Backup & Recovery Procedures',
    question: 'Are database backups taken regularly, tested for point-in-time restoration, and encrypted at rest?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Automated daily snapshots with 30-day retention and point-in-time recovery verification.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.SECURE_DEV,
    title: 'Secure Software Development Lifecycle',
    question: 'Are pre-commit hooks and automated CI security gates enforced before code is merged to main branches?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Developers must pass local pre-commit checks and CI pull request scans before merging.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.VULNERABILITY_MGMT,
    title: 'Vulnerability Management & Rule Auditing',
    question: 'Are custom regex detection rules validated for ReDoS vulnerabilities and updated continuously?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'All custom rules undergo ReDoS analysis with 15ms execution timeouts.',
  },
  {
    category: QUESTIONNAIRE_CATEGORIES.INTEGRATIONS,
    title: 'Third-Party Integration Security & Webhook Signatures',
    question: 'Are inbound webhook payloads verified using cryptographic signatures before processing?',
    defaultAnswer: QUESTION_ANSWERS.YES,
    explanation: 'Inbound GitHub and GitLab webhooks require valid HMAC-SHA256 signatures.',
  },
];

/**
 * Validate and format a questionnaire answer record.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.title
 * @param {string} params.category
 * @param {string} params.question
 * @param {'YES'|'NO'|'PARTIALLY'|'NOT_APPLICABLE'} params.answer
 * @param {string} params.explanation
 * @param {string[]} [params.evidenceIds=[]]
 * @param {string} [params.owner='Security Officer']
 * @returns {object} SecurityQuestionnaire
 */
export function createQuestionnaireRecord({
  organizationId,
  title,
  category,
  question,
  answer = QUESTION_ANSWERS.NOT_APPLICABLE,
  explanation = '',
  evidenceIds = [],
  owner = 'Security Officer',
}) {
  if (!organizationId || !title || !question) {
    throw new Error('organizationId, title, and question are required');
  }

  const validAnswer = Object.values(QUESTION_ANSWERS).includes(answer)
    ? answer
    : QUESTION_ANSWERS.NOT_APPLICABLE;

  const validCat = Object.values(QUESTIONNAIRE_CATEGORIES).includes(category)
    ? category
    : QUESTIONNAIRE_CATEGORIES.ACCESS_CONTROL;

  return {
    id: `quest_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    title: String(title).slice(0, 150),
    category: validCat,
    question: String(question).slice(0, 500),
    answer: validAnswer,
    explanation: String(explanation || '').slice(0, 2000),
    evidenceIds: Array.isArray(evidenceIds) ? evidenceIds : [],
    owner: String(owner || 'Security Officer').slice(0, 100),
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
