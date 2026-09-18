/**
 * app/api/providers/github/[owner]/[repo]/branches/route.js
 *
 * GET /api/providers/github/[owner]/[repo]/branches
 *
 * Lists branches for a GitHub repository.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBranches, isGitHubConfigured } from '@/lib/providers/github';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { owner, repo } = await params;

  if (!isGitHubConfigured()) {
    return NextResponse.json({ error: 'github_not_configured' }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('github_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
  }

  try {
    const branches = await getBranches(token, owner, repo);
    return NextResponse.json({
      branches: branches.map(b => ({
        name:      b.name,
        protected: b.protected,
        sha:       b.commit?.sha,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
