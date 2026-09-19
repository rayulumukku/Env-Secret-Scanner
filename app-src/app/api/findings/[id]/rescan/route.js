/**
 * app/api/findings/[id]/rescan/route.js
 *
 * POST /api/findings/[id]/rescan — Trigger automated rescan to verify secret removal.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { executeFindingRescan } from '@/lib/db/remediation.js';

export async function POST(req, { params }) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;

    const result = await executeFindingRescan(id, {
      userId: auth.user?.id,
      userEmail: auth.user?.email || 'User',
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
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
