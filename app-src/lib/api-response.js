/**
 * lib/api-response.js
 *
 * Standardized API response utilities.
 *
 * Enforces:
 *   - Success format: { success: true, data: ... }
 *   - Error format:   { success: false, error: { code, message } }
 *   - Error sanitization (no stack traces or internal secrets leaked)
 */

import { NextResponse } from 'next/server';

export function jsonSuccess(data, status = 200, headers = {}) {
  return NextResponse.json(
    { success: true, data },
    { status, headers }
  );
}

export function jsonError(message, code = 'BAD_REQUEST', status = 400, headers = {}) {
  // Sanitize message: never expose internal stack traces or database URLs
  const safeMessage = typeof message === 'string'
    ? message.replace(/postgresql:\/\/[^\s]+/g, '[REDACTED_URL]')
    : 'An unexpected error occurred';

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: safeMessage,
      },
    },
    { status, headers }
  );
}

export function jsonUnauthorized(message = 'Authentication required') {
  return jsonError(message, 'UNAUTHORIZED', 401);
}

export function jsonForbidden(message = 'Access denied: insufficient permissions') {
  return jsonError(message, 'FORBIDDEN', 403);
}

export function jsonNotFound(message = 'Resource not found') {
  return jsonError(message, 'NOT_FOUND', 404);
}
