/**
 * app/api/findings/[id]/remediation/route.js
 *
 * POST /api/findings/[id]/remediation — Update checklist, notes, and status.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { updateFindingRemediation } from '@/lib/db/remediation.js';

export async function POST(req, { params }) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const body = await req.json();

    const { status, checklist, notes } = body;

    const updated = await updateFindingRemediation(id, {
      status,
      checklist,
      notes,
      userId: auth.user?.id,
      userEmail: auth.user?.email || 'User',
    });

    return new Response(JSON.stringify({ success: true, finding: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const isPolicyViolation = err.message.includes('Security Policy Violation');
    return new Response(JSON.stringify({ error: err.message }), {
      status: isPolicyViolation ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
