/**
 * app/api/providers/github/connect/route.js
 *
 * GET /api/providers/github/connect
 *
 * Initiates the GitHub OAuth flow.
 * Generates a cryptographically random state, stores it in an HTTP-only cookie,
 * then redirects the user to GitHub's authorization page.
 *
 * SECURITY:
 *   - State is random and stored server-side (cookie) for CSRF validation
 *   - No sensitive data in redirect URL
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isGitHubConfigured, buildGitHubAuthUrl } from '@/lib/providers/github';

export const dynamic = 'force-dynamic';

export async function GET() {
  // If not configured, return a helpful setup message
  if (!isGitHubConfigured()) {
    return NextResponse.json(
      {
        error: 'github_not_configured',
        message: 'GitHub OAuth is not configured.',
        setup: 'Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables. See /docs for setup instructions.',
      },
      { status: 503 }
    );
  }

  // Generate CSRF state
  const state = crypto.randomUUID();
  const authUrl = buildGitHubAuthUrl(state);

  // Store state in HTTP-only cookie (5 minute expiry)
  const cookieStore = await cookies();
  cookieStore.set('github_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   300, // 5 minutes
    path:     '/',
  });

  return NextResponse.redirect(authUrl);
}
