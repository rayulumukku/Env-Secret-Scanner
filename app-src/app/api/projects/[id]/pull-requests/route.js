/**
 * app/api/projects/[id]/pull-requests/route.js
 *
 * GET /api/projects/[id]/pull-requests — List Pull Requests scanned for project.
 */

import { listProjectPullRequests } from '@/lib/db/pull-requests.js';
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

    const prs = await listProjectPullRequests(id);
    return new Response(JSON.stringify({ pullRequests: prs }), {
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
