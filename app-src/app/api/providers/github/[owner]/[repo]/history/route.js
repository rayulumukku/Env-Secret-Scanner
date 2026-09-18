/**
 * app/api/providers/github/[owner]/[repo]/history/route.js
 *
 * POST /api/providers/github/[owner]/[repo]/history
 *
 * Scans Git history of a GitHub repository for secrets.
 * Uses the GitHub API to fetch commits and their diffs.
 *
 * Body (JSON):
 *   {
 *     branch: string,
 *     maxCommits: number,            // default 200
 *     currentFingerprints: string[], // from current scan for lifecycle detection
 *     allowlistFingerprints: string[]
 *   }
 *
 * SECURITY:
 *   - Token read from HTTP-only cookie only
 *   - Raw diff content is never stored or returned
 *   - Raw secrets are masked at detection time
 *   - authorEmail is included only in commit metadata (not raw secrets)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isGitHubConfigured } from '@/lib/providers/github';
import { scanGitHistory } from '@/lib/repository/commit-scanner';
import { ExposureStatus } from '@/lib/models/index';

export const dynamic = 'force-dynamic';

// Hard cap to prevent runaway API usage
const ABSOLUTE_MAX_COMMITS = 500;

export async function POST(request, { params }) {
  const { owner, repo } = await params;

  if (!isGitHubConfigured()) {
    return NextResponse.json({ error: 'github_not_configured' }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('github_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch { /* use defaults */ }

  const {
    branch = 'HEAD',
    maxCommits = 200,
    currentFingerprints = [],
    allowlistFingerprints = [],
  } = body;

  const cappedMaxCommits = Math.min(maxCommits, ABSOLUTE_MAX_COMMITS);

  try {
    const result = await scanGitHistory({
      token,
      owner,
      repo,
      branch,
      currentFingerprints: new Set(currentFingerprints),
      allowlistFingerprints,
      maxCommits: cappedMaxCommits,
    });

    // Build safe response — commits include only masked findings
    const safeCommits = result.scannedCommits.map(commit => ({
      hash:         commit.hash,
      shortHash:    commit.shortHash,
      message:      commit.message,
      author:       commit.author,
      date:         commit.date,
      addedLines:   commit.addedLines,
      deletedLines: commit.deletedLines,
      filesChanged: commit.filesChanged,
      findingCount: commit.findings.length,
      hasCritical:  commit.findings.some(f => f.severity === 'CRITICAL'),
      findings:     commit.findings.map(f => ({
        // Only safe fields — no raw secrets, no raw diff
        fingerprint:  f.fingerprint,
        type:         f.type,
        category:     f.category,
        severity:     f.severity,
        confidence:   f.confidence,
        file:         f.file,
        line:         f.line,
        maskedValue:  f.maskedValue,
        description:  f.description,
        exposureStatus: f.exposureStatus,
      })),
    }));

    return NextResponse.json({
      owner,
      repo,
      branch,
      scannedCommits: safeCommits,
      lifecycles:     result.lifecycles,
      statistics:     result.statistics,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'History scan failed' }, { status: 502 });
  }
}
