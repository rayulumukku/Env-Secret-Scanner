import { NextResponse } from 'next/server';
import { scan } from '@/lib/scanner/engine';

/** Maximum file size per file: 500KB */
const MAX_FILE_SIZE = 500 * 1024;

/** Maximum total payload size: 5MB */
const MAX_TOTAL_SIZE = 5 * 1024 * 1024;

/** Allowed text file extensions */
const ALLOWED_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'php', 'java', 'go', 'rs', 'cs', 'cpp', 'c', 'h',
  'env', 'env.local', 'env.development', 'env.production', 'env.example',
  'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'tf', 'tfvars', 'hcl',
  'xml', 'properties', 'gradle',
  'txt', 'md', 'mdx',
  'Dockerfile', 'docker-compose',
  'gitignore', 'npmrc', 'nvmrc',
  'sql',
]);

/**
 * Sanitize and validate a filename.
 * @param {string} name
 * @returns {string|null} sanitized name or null if invalid
 */
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return null;
  if (name.length > 255) return null;

  // Strip path traversal and directory components
  const base = name
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^[/\\]+/, '')
    .split(/[/\\]/)
    .pop();

  if (!base || base.length === 0) return null;

  // Check extension (allow no-extension files like Dockerfile)
  const parts = base.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  } else {
    // No extension — allow known extensionless files
    const knownExtensionless = ['dockerfile', 'makefile', 'procfile', 'gemfile', 'rakefile'];
    if (!knownExtensionless.includes(base.toLowerCase())) return null;
  }

  // Sanitize filename — allow only safe characters
  return base.replace(/[^a-zA-Z0-9.\-_()[\]{}@# ]/g, '_');
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let files = [];
    let customRules = [];
    let allowlistFingerprints = [];
    let allowlistFiles = [];

    if (contentType.includes('application/json')) {
      // JSON payload
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON payload' },
          { status: 400 }
        );
      }

      if (!body || !Array.isArray(body.files)) {
        return NextResponse.json(
          { error: 'Request must include a files array' },
          { status: 400 }
        );
      }

      customRules = Array.isArray(body.customRules) ? body.customRules : [];
      allowlistFingerprints = Array.isArray(body.allowlistFingerprints) ? body.allowlistFingerprints : [];
      allowlistFiles = Array.isArray(body.allowlistFiles) ? body.allowlistFiles : [];

      let totalSize = 0;

      for (const file of body.files) {
        if (!file || typeof file.name !== 'string' || typeof file.content !== 'string') {
          continue;
        }

        const sanitizedName = sanitizeFilename(file.name);
        if (!sanitizedName) continue;

        const contentBytes = new TextEncoder().encode(file.content).length;
        if (contentBytes > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB per file.` },
            { status: 413 }
          );
        }

        totalSize += contentBytes;
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json(
            { error: `Total payload too large. Maximum is ${MAX_TOTAL_SIZE / 1024 / 1024}MB.` },
            { status: 413 }
          );
        }

        files.push({ name: sanitizedName, content: file.content });
      }
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No valid files to scan' },
        { status: 400 }
      );
    }

    // Run scanner — results contain only masked values
    const result = scan({
      files,
      customRules,
      allowlistFingerprints,
      allowlistFiles,
    });

    // SECURITY: Double-check no raw content leaks into response
    // The engine handles this, but we do a final strip here
    const safeResult = {
      id: result.id,
      timestamp: result.timestamp,
      stats: result.stats,
      findings: result.findings,
      allowlistedFindings: result.allowlistedFindings,
      scannedFiles: result.scannedFiles,
      errors: result.errors,
    };

    return NextResponse.json(safeResult, { status: 200 });
  } catch {
    // SECURITY: Generic error message — no internal details
    return NextResponse.json(
      { error: 'Scan failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
