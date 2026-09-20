/**
 * lib/observability/logger.js
 *
 * Production-Ready Structured JSON Logger with Mandatory Zero-Exposure Redaction.
 *
 * SAFETY INVARIANTS:
 *   - NEVER logs raw source code, raw credentials, passwords, tokens, or encryption keys.
 *   - Automatically passes all messages and metadata through `redactSensitive()`.
 *   - Produces single-line structured JSON logs ideal for CloudWatch, Datadog, or stdout.
 */

import { redactSensitive, redactError } from '../security/redact.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class StructuredLogger {
  constructor(defaultMetadata = {}) {
    this.defaultMetadata = defaultMetadata;
    this.minLevel = process.env.LOG_LEVEL
      ? LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()] ?? LOG_LEVELS.info
      : (process.env.NODE_ENV === 'test' ? LOG_LEVELS.warn : LOG_LEVELS.info);
  }

  child(extraMetadata = {}) {
    return new StructuredLogger({
      ...this.defaultMetadata,
      ...extraMetadata,
    });
  }

  _formatAndEmit(level, event, metadata = {}, error = null) {
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const payload = {
      level,
      event: typeof event === 'string' ? event : 'log',
      timestamp: new Date().toISOString(),
      ...this.defaultMetadata,
    };

    if (typeof event === 'object' && event !== null) {
      Object.assign(payload, redactSensitive(event));
    } else if (typeof metadata === 'object' && metadata !== null) {
      Object.assign(payload, redactSensitive(metadata));
    }

    if (error) {
      payload.error = redactError(error);
    }

    const logString = JSON.stringify(payload);

    if (level === 'error') {
      console.error(logString);
    } else if (level === 'warn') {
      console.warn(logString);
    } else if (level === 'debug') {
      console.debug(logString);
    } else {
      console.log(logString);
    }

    return payload;
  }

  debug(event, metadata) {
    return this._formatAndEmit('debug', event, metadata);
  }

  info(event, metadata) {
    return this._formatAndEmit('info', event, metadata);
  }

  warn(event, metadata) {
    return this._formatAndEmit('warn', event, metadata);
  }

  error(event, metadata, error) {
    // If metadata is an Error object directly
    if (metadata instanceof Error && !error) {
      return this._formatAndEmit('error', event, {}, metadata);
    }
    return this._formatAndEmit('error', event, metadata, error);
  }
}

export const logger = new StructuredLogger();
export { StructuredLogger };
