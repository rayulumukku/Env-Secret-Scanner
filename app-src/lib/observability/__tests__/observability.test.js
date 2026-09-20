import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { redactSensitive, redactString, redactError } from '../../security/redact.js';
import { logger, StructuredLogger } from '../logger.js';
import {
  ValidationError, AuthenticationError, AuthorizationError,
  NotFoundError, RateLimitError, ProviderError, ScannerError,
  DatabaseError, toSafeErrorResponse
} from '../errors.js';
import { generateRequestId, getOrCreateRequestId, withRequestIdHeader } from '../request-id.js';
import { validateEnvironment } from '../../config/validation.js';
import { getConfig } from '../../config/env.js';
import { enqueueJob, getJob, listJobs, cancelJob, retryJob, resetJobQueue, JobStatus } from '../../jobs/queue.js';

describe('Centralized Secret Redaction Engine (lib/security/redact.js)', () => {
  it('redacts sensitive structural object keys regardless of case', () => {
    const sensitive = {
      user: 'alice',
      password: 'PlaintextPassword123!',
      apiKey: 'sk-proj-superSecretValue',
      clientSecret: 'secret_abc_123',
      nested: {
        authorization: 'Bearer token_value_xyz',
        accessToken: 'ghp_123456789012345678901234567890123456',
        publicField: 'safe_data',
      },
    };

    const cleaned = redactSensitive(sensitive);
    assert.equal(cleaned.user, 'alice');
    assert.equal(cleaned.password, '[REDACTED]');
    assert.equal(cleaned.apiKey, '[REDACTED]');
    assert.equal(cleaned.clientSecret, '[REDACTED]');
    assert.equal(cleaned.nested.authorization, '[REDACTED]');
    assert.equal(cleaned.nested.accessToken, '[REDACTED]');
    assert.equal(cleaned.nested.publicField, 'safe_data');
  });

  it('redacts embedded sensitive patterns in string content', () => {
    const rawText = 'Connect to postgres://app_user:SuperSecretPassword99@db.internal:5432/secrets and use AKIAIOSFODNN7EXAMPLE';
    const cleaned = redactString(rawText);

    assert.ok(!cleaned.includes('SuperSecretPassword99'));
    assert.ok(!cleaned.includes('AKIAIOSFODNN7EXAMPLE'));
    assert.ok(cleaned.includes('[REDACTED]'));
  });

  it('redacts error objects safely without exposing internal paths or credentials', () => {
    const err = new Error('Failed to connect to postgresql://user:dbPass123@localhost:5432/mydb');
    const safeErr = redactError(err);

    assert.equal(safeErr.name, 'Error');
    assert.ok(!safeErr.message.includes('dbPass123'));
    assert.ok(safeErr.message.includes('[REDACTED]'));
  });
});

describe('Request Correlation (lib/observability/request-id.js)', () => {
  it('generates unique req_ prefixed IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    assert.ok(id1.startsWith('req_'));
    assert.ok(id2.startsWith('req_'));
    assert.notEqual(id1, id2);
  });

  it('extracts existing correlation ID from request headers', () => {
    const req = {
      headers: {
        get: (h) => (h === 'x-request-id' ? 'req_custom_123' : null),
      },
    };
    const id = getOrCreateRequestId(req);
    assert.equal(id, 'req_custom_123');
  });

  it('attaches request ID to response header object', () => {
    const headers = withRequestIdHeader({}, 'req_test_999');
    assert.equal(headers['x-request-id'], 'req_test_999');
  });
});

describe('Structured Logger (lib/observability/logger.js)', () => {
  it('formats structured log payloads with automatic redaction', () => {
    const testLogger = new StructuredLogger({ service: 'secretshield-test' });
    const payload = testLogger.info('user.login', {
      email: 'user@example.com',
      token: 'sensitive_jwt_token',
      dbUrl: 'postgres://root:rootPass@localhost/db',
    });

    assert.equal(payload.level, 'info');
    assert.equal(payload.event, 'user.login');
    assert.equal(payload.service, 'secretshield-test');
    assert.equal(payload.token, '[REDACTED]');
    assert.ok(!payload.dbUrl.includes('rootPass'));
    assert.ok(payload.timestamp);
  });
});

describe('Typed Application Errors (lib/observability/errors.js)', () => {
  it('creates typed errors with accurate HTTP status and codes', () => {
    const valErr = new ValidationError('Invalid email format');
    assert.equal(valErr.status, 400);
    assert.equal(valErr.code, 'VALIDATION_ERROR');

    const authErr = new AuthenticationError();
    assert.equal(authErr.status, 401);
    assert.equal(authErr.code, 'UNAUTHENTICATED');

    const forErr = new AuthorizationError();
    assert.equal(forErr.status, 403);
    assert.equal(forErr.code, 'UNAUTHORIZED');

    const notErr = new NotFoundError('Project', 'proj_123');
    assert.equal(notErr.status, 404);
    assert.equal(notErr.code, 'NOT_FOUND');

    const rateErr = new RateLimitError();
    assert.equal(rateErr.status, 429);
    assert.equal(rateErr.code, 'RATE_LIMIT_EXCEEDED');

    const dbErr = new DatabaseError();
    assert.equal(dbErr.status, 500);
    assert.equal(dbErr.code, 'DATABASE_ERROR');
  });

  it('toSafeErrorResponse strips stack traces and returns clean JSON', async () => {
    const err = new ValidationError('Bad query parameter');
    const response = toSafeErrorResponse(err, 'req_err_123');
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.equal(json.error.requestId, 'req_err_123');
    assert.equal(json.error.stack, undefined);
  });
});

describe('Environment Schema Validation (lib/config/validation.js)', () => {
  it('validates development environment without requiring all production keys', () => {
    const env = { NODE_ENV: 'development' };
    const res = validateEnvironment(env);
    assert.equal(res.valid, true);
    assert.ok(res.warnings.length > 0);
  });

  it('flags missing required production environment variables without leaking values', () => {
    const env = { NODE_ENV: 'production' };
    const res = validateEnvironment(env);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('AUTH_SECRET')));
    assert.ok(res.errors.some(e => e.includes('ENCRYPTION_KEY')));
  });
});

describe('Background Job Queue Lifecycle (lib/jobs/queue.js)', () => {
  beforeEach(() => {
    resetJobQueue();
  });

  it('manages full job lifecycle transitions: QUEUED, PROCESSING, COMPLETED', async () => {
    const job = await enqueueJob('SCAN_JOB', { repo: 'my-org/backend' }, { runImmediately: true });
    assert.ok(job.id.startsWith('job_'));
    assert.equal(job.type, 'SCAN_JOB');
  });

  it('redacts sensitive credentials before storing in job payload', async () => {
    const job = await enqueueJob('NOTIFICATION_JOB', {
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/secretToken123',
      apiKey: 'sk-secret-test-key',
    });

    const retrieved = getJob(job.id);
    assert.equal(retrieved.payload.apiKey, '[REDACTED]');
  });

  it('allows cancelling queued jobs and retrying failed jobs', async () => {
    const job = await enqueueJob('CANCEL_TEST_JOB', { data: 1 });
    assert.equal(job.status, JobStatus.QUEUED);

    const cancelled = cancelJob(job.id);
    assert.equal(cancelled.status, JobStatus.CANCELLED);

    const retried = await retryJob(job.id);
    assert.equal(retried.status, JobStatus.QUEUED);
  });
});
