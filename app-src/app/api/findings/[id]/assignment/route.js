/**
 * app/api/findings/[id]/assignment/route.js
 *
 * PATCH /api/findings/[id]/assignment — Update finding assignee, priority, and SLA due date.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { updateFindingAssignment } from '@/lib/db/remediation.js';

export async function PATCH(req, { params }) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const body = await req.json();

    const { assigneeId, assigneeEmail, priority, dueDate } = body;

    const updated = await updateFindingAssignment(id, {
      assigneeId,
      assigneeEmail,
      priority,
      dueDate,
      userId: auth.user?.id,
      userEmail: auth.user?.email || 'User',
    });

    return new Response(JSON.stringify({ success: true, finding: updated }), {
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
