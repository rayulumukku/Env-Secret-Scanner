/**
 * app/api/remediation/stats/route.js
 *
 * GET /api/remediation/stats — Remediation velocity, MTTR, and SLA metrics.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { getRemediationMetrics } from '@/lib/db/remediation.js';

export async function GET(req) {
  try {
    const auth = await getAuthContext(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || null;

    const stats = await getRemediationMetrics(auth.currentOrgId || 'default', projectId);
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
