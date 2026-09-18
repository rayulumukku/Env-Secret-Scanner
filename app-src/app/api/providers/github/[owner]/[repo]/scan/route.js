/**
 * app/api/providers/github/[owner]/[repo]/scan/route.js
 *
 * POST /api/providers/github/[owner]/[repo]/scan
 *
 * Downloads a GitHub repository archive and scans it for secrets.
 * Reuses the existing ZIP scanning pipeline.
 *
 * Body (JSON):
 *   { branch: string, config: object, allowlistFingerprints: string[] }
 *
 * SECURITY:
 *   - Token read from HTTP-only cookie only
 *   - Archive processed in-memory, never written to disk
 *   - Raw secrets never returned in response
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getArchive, getRepository, isGitHubConfigured } from '@/lib/providers/github';
import { scanZipRepository } from '@/lib/repository/repository-scanner';
import { recordScan } from '@/lib/repository/history';
import { isValidZipBuffer } from '@/lib/repository/archive';

export const dynamic = 'force-dynamic';

// GitHub archives can be large — allow up to 100MB for GitHub repos
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;

export async function POST(request, { params }) {
  const { owner, repo } = await params;

  if (!isGitHubConfigured()) {
    return NextResponse.json({ error: 'github_not_configured', message: 'GitHub OAuth is not configured.' }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('github_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'not_authenticated', message: 'Not connected to GitHub.' }, { status: 401 });
  }

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch { /* use defaults */ }

  const {
    branch = 'HEAD',
    config = {},
    allowlistFingerprints = [],
  } = body;

  try {
    // Get repository metadata
    const repoMeta = await getRepository(token, owner, repo);

    // Download archive in memory
    const { buffer: archiveBuffer, filename } = await getArchive(token, owner, repo, branch);

    if (!archiveBuffer || archiveBuffer.length === 0) {
      return NextResponse.json({ error: 'Empty archive received from GitHub' }, { status: 400 });
    }

    if (archiveBuffer.length > MAX_ARCHIVE_BYTES) {
      return NextResponse.json({
        error: `Repository archive too large (${(archiveBuffer.length / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_ARCHIVE_BYTES / 1024 / 1024}MB.`,
      }, { status: 413 });
    }

    if (!isValidZipBuffer(archiveBuffer)) {
      return NextResponse.json({ error: 'Archive from GitHub is not a valid ZIP file.' }, { status: 400 });
    }

    // Run the scan using the existing pipeline
    const result = await scanZipRepository(archiveBuffer, {
      repositoryName: `${owner}/${repo}`,
      archiveName: filename,
      scanConfig: {
        ...config,
        includeHidden: true,  // .env files are critical
      },
      allowlistFingerprints,
    });

    // Enrich result with GitHub metadata
    result.repository = {
      ...result.repository,
      provider:      'github',
      owner,
      repo,
      branch,
      fullName:      repoMeta.full_name,
      defaultBranch: repoMeta.default_branch,
      htmlUrl:       repoMeta.html_url,
      isPrivate:     repoMeta.private,
    };

    // Record safe scan metadata
    recordScan(result);

    // Return only safe, masked data
    return NextResponse.json({
      scanId:          result.scanId,
      status:          result.status,
      timestamp:       result.timestamp,
      duration:        result.duration,
      repository:      result.repository,
      statistics:      result.statistics,
      findings:        result.findings,         // masked by scanner
      groupedFindings: result.groupedFindings,
      fileTree:        result.fileTree,
      scannedFiles:    result.scannedFiles,
      skippedFiles:    result.skippedFiles,
      errors:          result.errors,
      config:          result.config,
    });

  } catch (err) {
    const isUserErr = err.message?.includes('large') || err.message?.includes('ZIP');
    return NextResponse.json(
      { error: err.message || 'Scan failed' },
      { status: isUserErr ? 400 : 502 }
    );
  }
}
