/**
 * app/api/providers/github/callback/route.js
 *
 * GET /api/providers/github/callback?code=X&state=Y
 *
 * Handles the GitHub OAuth callback.
 * Validates state (CSRF), exchanges code for access token,
 * stores token in HTTP-only cookie, redirects to repository selector.
 *
 * SECURITY:
 *   - State validated against cookie (CSRF protection)
 *   - Access token stored ONLY in HTTP-only cookie — never sent to client JS
 *   - Authorization code used once and discarded
 *   - Error paths clear sensitive cookies
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, isGitHubConfigured } from '@/lib/providers/github';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();

  // ── GitHub-side errors ────────────────────────────────────────────────────
  if (error) {
    cookieStore.delete('github_oauth_state');
    const desc = searchParams.get('error_description') || error;
    return NextResponse.redirect(`${BASE_URL}/repositories/github?error=${encodeURIComponent(desc)}`);
  }

  // ── Validate CSRF state ───────────────────────────────────────────────────
  const savedState = cookieStore.get('github_oauth_state')?.value;
  cookieStore.delete('github_oauth_state'); // consume state — one-time use

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${BASE_URL}/repositories/github?error=${encodeURIComponent('Invalid OAuth state. Please try connecting again.')}`);
  }

  // ── Validate code ─────────────────────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/repositories/github?error=${encodeURIComponent('No authorization code received from GitHub.')}`);
  }

  if (!isGitHubConfigured()) {
    return NextResponse.redirect(`${BASE_URL}/repositories/github?error=${encodeURIComponent('GitHub OAuth is not configured on this server.')}`);
  }

  // ── Exchange code for token ───────────────────────────────────────────────
  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch (err) {
    const msg = err.message || 'Token exchange failed';
    return NextResponse.redirect(`${BASE_URL}/repositories/github?error=${encodeURIComponent(msg)}`);
  }

  // ── Store token securely ──────────────────────────────────────────────────
  // SECURITY: HTTP-only cookie — never accessible via document.cookie or JS
  cookieStore.set('github_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 8,  // 8 hours
    path:     '/',
  });

  // ── Redirect to repository selector ───────────────────────────────────────
  return NextResponse.redirect(`${BASE_URL}/repositories/github?connected=1`);
}
