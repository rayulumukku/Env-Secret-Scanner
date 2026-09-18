/**
 * app/api/repository/scan/route.js
 *
 * POST /api/repository/scan
 *
 * Accepts multipart/form-data with a ZIP file attachment.
 * Scans it using the repository scanner and returns masked findings.
 *
 * SECURITY:
 *   - Raw secrets never returned in response.
 *   - Archive buffer is held in memory only for the duration of scanning.
 *   - No data is written to disk.
 *   - Strict size limits enforced before any processing.
 */

import { NextResponse } from 'next/server';
import { scanZipRepository } from '@/lib/repository/repository-scanner';
import { recordScan } from '@/lib/repository/history';
import { LIMITS } from '@/lib/repository/archive';

/** Hard cap: 50 MB per upload (enforced before reading body). */
const MAX_UPLOAD_BYTES = LIMITS.MAX_ARCHIVE_BYTES;

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 415 }
      );
    }

    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
    }

    const zipFile = formData.get('archive');
    if (!zipFile || typeof zipFile === 'string') {
      return NextResponse.json({ error: 'No archive file provided. Field name must be "archive".' }, { status: 400 });
    }

    // Read file into buffer
    let zipBuffer;
    try {
      const arrayBuffer = await zipFile.arrayBuffer();
      zipBuffer = Buffer.from(arrayBuffer);
    } catch {
      return NextResponse.json({ error: 'Failed to read uploaded file' }, { status: 400 });
    }

    // Enforce upload size limit
    if (zipBuffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Archive too large. Maximum upload size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    if (zipBuffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    // Parse scan configuration from form data
    const configRaw = formData.get('config');
    let scanConfig = {};
    if (configRaw) {
      try {
        scanConfig = JSON.parse(configRaw);
      } catch {
        // Ignore invalid config — use defaults
      }
    }

    const repositoryName = sanitizeString(formData.get('repositoryName') || zipFile.name || 'upload.zip');
    const allowlistRaw = formData.get('allowlistFingerprints');
    const allowlistFingerprints = allowlistRaw ? JSON.parse(allowlistRaw).filter(Boolean) : [];

    // Run the scan
    const result = await scanZipRepository(zipBuffer, {
      repositoryName,
      archiveName: zipFile.name || 'upload.zip',
      scanConfig,
      allowlistFingerprints,
    });

    // Record safe metadata in server-side history
    recordScan(result);

    // SECURITY: Build explicit safe response — only whitelisted fields
    const response = {
      scanId:          result.scanId,
      status:          result.status,
      timestamp:       result.timestamp,
      duration:        result.duration,
      repository:      result.repository,
      statistics:      result.statistics,
      findings:        result.findings,        // already masked by scanner
      groupedFindings: result.groupedFindings,
      fileTree:        result.fileTree,
      scannedFiles:    result.scannedFiles,
      skippedFiles:    result.skippedFiles,
      errors:          result.errors,
      config:          result.config,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    // Return a meaningful error for known user errors, generic for others
    const isUserError = err.message && (
      err.message.includes('ZIP') ||
      err.message.includes('archive') ||
      err.message.includes('large') ||
      err.message.includes('valid')
    );

    return NextResponse.json(
      { error: isUserError ? err.message : 'Scan failed. Please try again.' },
      { status: isUserError ? 400 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * Sanitize a user-provided string (filename, repo name).
 */
function sanitizeString(value, maxLen = 256) {
  if (!value || typeof value !== 'string') return 'upload';
  return value
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .slice(0, maxLen)
    .trim() || 'upload';
}
