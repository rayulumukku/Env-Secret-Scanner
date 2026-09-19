/**
 * app/api/findings/[id]/comments/route.js
 *
 * POST /api/findings/[id]/comments — Add comment to finding discussion thread.
 *
 * SECURITY INVARIANT:
 *   - Verifies that no credentials/passwords/tokens exist in the comment.
 *   - Rejects submissions with secrets before storage.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { addFindingComment } from '@/lib/db/remediation.js';

export async function POST(req, { params }) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const body = await req.json();

    const { text } = body;
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Comment text cannot be empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await addFindingComment(id, {
      userId: auth.user?.id,
      userEmail: auth.user?.email || 'User',
      userName: auth.user?.name || auth.user?.email?.split('@')[0] || 'Team Member',
      text: text.trim(),
    });

    return new Response(JSON.stringify({ success: true, comment }), {
      status: 201,
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
