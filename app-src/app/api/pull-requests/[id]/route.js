/**
 * @file app/api/pull-requests/[id]/route.js
 * @description Pull Request security intelligence and timeline endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { evaluatePullRequestSecurity } from '@/lib/repository/pr-intelligence';

export async function GET(req, { params }) {
  const auth = await getAuthContext(req, { requiredPermission: 'REPO_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { id } = await params;
  const prNumber = parseInt(id, 10) || 104;

  const pr = {
    number: prNumber,
    title: `Add checkout webhook handler and payment API integration`,
    author: 'developer@secretshield.dev',
    sourceBranch: 'feature/payment-api',
    targetBranch: 'main',
    createdAt: '2026-09-18T14:30:00Z',
    updatedAt: '2026-09-19T09:15:00Z',
    commitCount: 3,
    htmlUrl: `https://github.com/pull/${prNumber}`
  };

  const baseFindings = [
    {
      id: 'find_db_1',
      fingerprint: 'fp_db_001',
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL URI',
      severity: 'HIGH',
      file: 'config/db.js',
      line: 8,
      maskedValue: 'postgresql://usr:••••@localhost:5432'
    }
  ];

  const prFindings = [
    {
      id: 'find_db_1',
      fingerprint: 'fp_db_001',
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL URI',
      severity: 'HIGH',
      file: 'config/db.js',
      line: 8,
      maskedValue: 'postgresql://usr:••••@localhost:5432'
    }
  ];

  const evaluation = evaluatePullRequestSecurity(pr, prFindings, baseFindings);

  const timeline = [
    { type: 'PR_OPENED', title: 'Pull Request #104 Opened', timestamp: '2026-09-18 14:30', description: 'Opened from feature/payment-api into main' },
    { type: 'SCAN_TRIGGERED', title: 'Initial Diff Scan', timestamp: '2026-09-18 14:31', description: 'SecretShield diff scanner ran on 3 changed files' },
    { type: 'FINDINGS_DETECTED', title: 'Finding Flagged in Commit f78e901', timestamp: '2026-09-18 14:32', description: 'Detected sk_test_•••• in src/billing.js' },
    { type: 'COMMIT_PUSHED', title: 'Remediation Commit a1b2c3d Pushed', timestamp: '2026-09-19 09:10', description: 'Replaced credential with process.env.STRIPE_KEY' },
    { type: 'RESCAN_COMPLETED', title: 'Rescan Passed', timestamp: '2026-09-19 09:15', description: '0 new findings introduced. GitHub Check updated to SUCCESS' }
  ];

  const changedFiles = [
    { filePath: 'src/services/billing.js', changeType: 'MODIFIED', additions: 35, deletions: 10 },
    { filePath: 'src/webhooks/stripe.js', changeType: 'ADDED', additions: 60, deletions: 0 },
    { filePath: 'package.json', changeType: 'MODIFIED', additions: 1, deletions: 0 }
  ];

  return jsonSuccess({
    pullRequest: pr,
    evaluation,
    timeline,
    changedFiles
  });
}
