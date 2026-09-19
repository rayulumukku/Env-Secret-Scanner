/**
 * app/api/findings/[id]/timeline/route.js
 *
 * GET /api/findings/[id]/timeline — Event timeline for a finding.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { getFindingDetails } from '@/lib/db/remediation.js';

export async function GET(req, { params }) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;

    const finding = await getFindingDetails(id);
    if (!finding) {
      return new Response(JSON.stringify({ error: 'Finding not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ timeline: finding.timeline || [] }), {
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
