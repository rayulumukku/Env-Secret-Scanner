/**
 * app/api/projects/[id]/activity/route.js
 *
 * GET /api/projects/[id]/activity — Returns security timeline for project.
 */

import { getProjectActivity } from '@/lib/db/activity.js';
import { getProjectById } from '@/lib/db/projects.js';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const activity = await getProjectActivity(id, { type, limit });
    return new Response(JSON.stringify({ activity }), {
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
