/**
 * app/api/providers/github/repositories/route.js
 *
 * GET /api/providers/github/repositories
 *
 * Lists repositories for the authenticated GitHub user.
 * Reads the GitHub token from the HTTP-only cookie — never from client JS.
 *
 * SECURITY: Token is read server-side only. Raw secrets never logged.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getRepositories,
  getAuthenticatedUser,
  isGitHubConfigured,
} from '@/lib/providers/github';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isGitHubConfigured()) {
    return NextResponse.json(
      { error: 'github_not_configured', message: 'GitHub OAuth is not configured on this server.' },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('github_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'not_authenticated', message: 'Not connected to GitHub. Please connect first.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, parseInt(searchParams.get('page')    || '1', 10));
  const perPage = Math.min(50, parseInt(searchParams.get('perPage') || '30', 10));
  const sort    = searchParams.get('sort') || 'updated';

  try {
    const [repos, user] = await Promise.all([
      getRepositories(token, { page, perPage, sort }),
      getAuthenticatedUser(token),
    ]);

    // Return safe subset — no tokens, no internal GitHub metadata
    const safeRepos = repos.map(r => ({
      id:            r.id,
      name:          r.name,
      fullName:      r.full_name,
      description:   r.description,
      isPrivate:     r.private,
      defaultBranch: r.default_branch,
      htmlUrl:       r.html_url,
      language:      r.language,
      stargazers:    r.stargazers_count,
      updatedAt:     r.updated_at,
      owner: {
        login:     r.owner?.login,
        avatarUrl: r.owner?.avatar_url,
      },
    }));

    return NextResponse.json({
      user:         { login: user?.login, avatarUrl: user?.avatar_url, name: user?.name },
      repositories: safeRepos,
      page,
      perPage,
      hasMore: repos.length === perPage,
    });
  } catch (err) {
    const isAuth = err.message?.includes('invalid') || err.message?.includes('expired');
    return NextResponse.json(
      { error: isAuth ? 'token_invalid' : 'api_error', message: err.message },
      { status: isAuth ? 401 : 502 }
    );
  }
}

/**
 * DELETE /api/providers/github/repositories
 * Disconnect GitHub — clears the HTTP-only token cookie.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('github_token');
  return NextResponse.json({ disconnected: true });
}
