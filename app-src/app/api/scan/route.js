import { NextResponse } from 'next/server';
import { scan } from '@/lib/scanner/engine';

/** Maximum file size per file: 2MB */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Maximum total payload size: 10MB */
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

/** Allowed text file extensions */
const ALLOWED_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'php', 'java', 'go', 'rs', 'cs', 'cpp', 'c', 'h',
  'env', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config', 'properties',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'tf', 'tfvars', 'hcl',
  'xml', 'gradle', 'pom',
  'txt', 'md', 'mdx',
  'sql', 'prisma',
  'npmrc', 'nvmrc', 'gitignore', 'dockerignore', 'editorconfig',
  'pem', 'key', 'crt', 'cert',
  'lock',
]);

/**
 * Sanitize and validate a filename.
 * @param {string} name
 * @returns {string|null}
 */
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return null;
  if (name.length > 512) return null;

  // Strip path traversal
  const sanitized = name
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^[/\\]+/, '')
    .split(/[/\\]/)
    .filter(p => p && p !== '..')
    .join('/');

  if (!sanitized || sanitized.length === 0) return null;

  const basename = sanitized.split('/').pop();
  if (!basename) return null;

  // Check extension
  const parts = basename.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  } else {
    // No extension — allow known extensionless files
    const known = ['dockerfile', 'makefile', 'procfile', 'gemfile', 'rakefile', 'brewfile'];
    if (!known.includes(basename.toLowerCase())) return null;
  }

  return sanitized.replace(/[^a-zA-Z0-9./\-_()[\]{}@# ]/g, '_');
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!body || !Array.isArray(body.files)) {
      return NextResponse.json(
        { error: 'Request must include a files array' },
        { status: 400 }
      );
    }

    const customRules = Array.isArray(body.customRules) ? body.customRules : [];
    const allowlistFingerprints = Array.isArray(body.allowlistFingerprints) ? body.allowlistFingerprints : [];
    const allowlistFiles = Array.isArray(body.allowlistFiles) ? body.allowlistFiles : [];

    const files = [];
    let totalSize = 0;

    for (const file of body.files) {
      if (!file || typeof file.name !== 'string' || typeof file.content !== 'string') continue;

      const sanitizedName = sanitizeFilename(file.name);
      if (!sanitizedName) continue;

      const contentBytes = new TextEncoder().encode(file.content).length;
      if (contentBytes > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${sanitizedName}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` },
          { status: 413 }
        );
      }

      totalSize += contentBytes;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: `Total payload exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit.` },
          { status: 413 }
        );
      }

      files.push({ name: sanitizedName, content: file.content });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No valid files to scan' }, { status: 400 });
    }

    // Run the scanner — only masked values in results
    const result = scan({ files, customRules, allowlistFingerprints, allowlistFiles });

    // SECURITY: Explicit safe response — only whitelisted fields
    const response = {
      scanId:       result.scanId,
      status:       result.status,
      timestamp:    result.timestamp,
      duration:     result.duration,
      filesScanned: result.filesScanned,
      statistics:   result.statistics,
      stats:        result.stats,       // backwards compat for UI
      findings:     result.findings,
      allowlistedFindings: result.allowlistedFindings,
      scannedFiles: result.scannedFiles,
      skippedFiles: result.skippedFiles,
      errors:       result.errors,
    };

    return NextResponse.json(response, { status: 200 });

  } catch {
    // SECURITY: Generic error — no internal details leaked
    return NextResponse.json(
      { error: 'Scan failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
