/**
 * @file app/api/projects/[id]/compare/route.js
 * @description Compares two branches in a project repository and categorizes findings.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { compareBranches } from '@/lib/repository/comparison';

export async function GET(req, { params }) {
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const baseBranch = searchParams.get('base') || 'main';
  const compareBranch = searchParams.get('compare') || 'feature/payment-api';

  // Sample base & compare branch findings for demonstration
  const baseFindings = [
    {
      id: 'find_base_1',
      fingerprint: 'fp_db_conn_string',
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL Connection URI',
      severity: 'HIGH',
      file: 'config/database.js',
      line: 12,
      maskedValue: 'postgresql://postgres:••••••••@localhost:5432/app'
    }
  ];

  const compareFindings = [
    {
      id: 'find_base_1',
      fingerprint: 'fp_db_conn_string',
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL Connection URI',
      severity: 'HIGH',
      file: 'config/database.js',
      line: 12,
      maskedValue: 'postgresql://postgres:••••••••@localhost:5432/app'
    },
    {
      id: 'find_compare_new',
      fingerprint: 'fp_stripe_test_key',
      ruleId: 'STRIPE_API_KEY',
      ruleName: 'Stripe API Key',
      severity: 'HIGH',
      file: 'src/services/billing.js',
      line: 45,
      maskedValue: 'sk_test_••••••••5678'
    }
  ];

  const result = compareBranches(baseFindings, compareFindings, {
    baseBranch,
    compareBranch
  });

  return jsonSuccess({
    projectId: id,
    ...result
  });
}
