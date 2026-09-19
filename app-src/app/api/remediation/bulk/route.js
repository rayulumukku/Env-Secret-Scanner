/**
 * app/api/remediation/bulk/route.js
 *
 * POST /api/remediation/bulk — Bulk remediation operations across findings.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { bulkRemediate } from '@/lib/db/remediation.js';

export async function POST(req) {
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();

    const { findingIds = [], action, status, assigneeId, assigneeEmail, note } = body;

    if (!findingIds || findingIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No finding IDs provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await bulkRemediate(findingIds, { action, status, assigneeId, assigneeEmail, note }, {
      userId: auth.user?.id,
      userEmail: auth.user?.email || 'User',
    });

    return new Response(JSON.stringify({ success: true, count: updated.length, updated }), {
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
