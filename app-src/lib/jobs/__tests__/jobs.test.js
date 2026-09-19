/**
 * lib/jobs/__tests__/jobs.test.js
 *
 * Automated tests for background job queue and worker scheduling.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerJobHandler,
  enqueueJob,
  getJob,
  JobStatus,
  resetJobQueue,
} from '../queue.js';

test('Background Job Queue', async (t) => {
  t.beforeEach(() => {
    resetJobQueue();
  });

  await t.test('enqueueJob executes registered handler and marks status COMPLETED', async () => {
    let executedPayload = null;

    registerJobHandler('TEST_JOB', async (payload) => {
      executedPayload = payload;
      return { ok: true, processedCount: payload.items?.length || 0 };
    });

    const job = await enqueueJob('TEST_JOB', { items: [1, 2, 3] }, { runImmediately: true });

    assert.equal(job.status, JobStatus.COMPLETED);
    assert.deepEqual(executedPayload, { items: [1, 2, 3] });
    assert.equal(job.result.processedCount, 3);
  });

  await t.test('enqueueJob captures handler errors and fails gracefully', async () => {
    registerJobHandler('FAILING_JOB', async () => {
      throw new Error('Database connection failed in worker');
    });

    const job = await enqueueJob('FAILING_JOB', { data: 123 }, { runImmediately: true, maxRetries: 0 });

    assert.equal(job.status, JobStatus.FAILED);
    assert.ok(job.error.includes('Database connection failed in worker'));
  });

  await t.test('enqueueJob fails on unregistered job type', async () => {
    const job = await enqueueJob('UNREGISTERED_TYPE_XYZ', {}, { runImmediately: true });
    assert.equal(job.status, JobStatus.FAILED);
    assert.ok(job.error.includes('No handler registered'));
  });
});
