/**
 * lib/observability/errors.js
 *
 * Centralized Application Error Classes and Safe Response Sanitizer.
 *
 * SECURITY INVARIANTS:
 *   - NEVER leaks raw database connection strings or passwords in error messages.
 *   - Strips internal file system paths and stack traces from client-facing responses.
 *   - Provides deterministic machine-readable error codes and HTTP status codes.
 */

import { redactSensitive, redactString } from '../security/redact.js';

export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500, details = null) {
    super(typeof message === 'string' ? redactString(message) : 'An internal error occurred');
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details ? redactSensitive(details) : null;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied: insufficient permissions') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = '') {
    const msg = id ? `${resource} with ID "${id}" was not found.` : `${resource} not found.`;
    super(msg, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.', retryAfterSeconds = 60) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter: retryAfterSeconds });
  }
}

export class ProviderError extends AppError {
  constructor(provider = 'External provider', message = 'Provider request failed') {
    super(`Provider error (${provider}): ${message}`, 'PROVIDER_ERROR', 502);
  }
}

export class ScannerError extends AppError {
  constructor(message = 'Scanner engine encountered an error') {
    super(message, 'SCANNER_ERROR', 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    // Sanitize any potential SQL strings or connection credentials
    const safeMsg = 'A database operation error occurred. Please verify your connection.';
    super(safeMsg, 'DATABASE_ERROR', 500);
  }
}

/**
 * Convert any caught error into a safe Next.js JSON response.
 *
 * @param {Error|AppError|any} error
 * @param {string} [requestId]
 * @returns {NextResponse}
 */
export function toSafeErrorResponse(error, requestId) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred. Please try again later.';
  let details = null;

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error && typeof error === 'object') {
    if (error.status && typeof error.status === 'number') status = error.status;
    if (error.code && typeof error.code === 'string') code = error.code;
    if (error.message && typeof error.message === 'string') {
      message = redactString(error.message);
    }
  }

  // Never return internal stack traces in response body
  const body = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(requestId ? { requestId } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  if (requestId) {
    headers['x-request-id'] = requestId;
  }

  return Response.json(body, { status, headers });
}
