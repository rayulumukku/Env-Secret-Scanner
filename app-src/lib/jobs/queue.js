/**
 * lib/jobs/queue.js
 *
 * Production-Ready Background Job Queue with Lifecycle Tracking & Cancellation.
 *
 * Job Lifecycle States:
 *   QUEUED -> PROCESSING -> COMPLETED | FAILED | CANCELLED
 *
 * SAFETY INVARIANTS:
 *   - NEVER stores raw credentials, tokens, or passwords in job payloads.
 *   - Restricts execution strictly to registered, whitelisted job types.
 *   - Does not allow arbitrary code execution from user input.
 */

import { redactSensitive } from '../security/redact.js';

export const JobStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// In-memory queue state
const jobRegistry = new Map();
const activeJobs = new Map();
let jobCounter = 0;
let isWorkerRunning = false;
const queue = [];

/**
 * Register a job handler function for a specific job type.
 *
 * @param {string} jobType
 * @param {Function} handler - async (payload, jobContext) => result
 */
export function registerJobHandler(jobType, handler) {
  jobRegistry.set(jobType, handler);
}

/**
 * Enqueue a new background job.
 *
 * @param {string} jobType - e.g. 'SCAN_PUSH', 'SCAN_PR', 'GITHUB_CHECK', 'NOTIFICATIONS', 'WEBHOOK_DISPATCH'
 * @param {object} payload - Input data for the job
 * @param {object} [options]
 * @param {boolean} [options.runImmediately=false]
 * @param {number} [options.maxRetries=2]
 * @returns {Promise<object>} Job descriptor
 */
export async function enqueueJob(jobType, payload = {}, options = {}) {
  const jobId = `job_${Date.now()}_${++jobCounter}`;
  const sanitizedPayload = redactSensitive(payload);

  const job = {
    id: jobId,
    type: jobType,
    payload: sanitizedPayload,
    status: JobStatus.QUEUED,
    attempts: 0,
    maxRetries: options.maxRetries ?? 2,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    durationMs: 0,
    errorCode: null,
    error: null,
    result: null,
  };

  activeJobs.set(jobId, job);

  if (options.runImmediately || process.env.NODE_ENV === 'test') {
    return processJobDirectly(job);
  }

  queue.push(job);
  scheduleWorker();
  return job;
}

/**
 * Schedule background worker loop.
 */
function scheduleWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  setImmediate(async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) continue;
      // Skip cancelled jobs in queue
      if (job.status === JobStatus.CANCELLED) continue;

      await processJobDirectly(job);
    }
    isWorkerRunning = false;
  });
}

/**
 * Execute a single job handler.
 */
async function processJobDirectly(job) {
  if (job.status === JobStatus.CANCELLED) {
    return job;
  }

  const handler = jobRegistry.get(job.type);
  if (!handler) {
    job.status = JobStatus.FAILED;
    job.errorCode = 'NO_HANDLER_REGISTERED';
    job.error = `No handler registered for job type "${job.type}"`;
    job.completedAt = new Date().toISOString();
    return job;
  }

  job.status = JobStatus.PROCESSING;
  const startTs = Date.now();
  job.startedAt = new Date(startTs).toISOString();
  job.attempts++;

  try {
    const result = await handler(job.payload, { jobId: job.id, attempts: job.attempts });
    job.status = JobStatus.COMPLETED;
    job.result = redactSensitive(result);
    job.completedAt = new Date().toISOString();
    job.durationMs = Date.now() - startTs;
    return job;
  } catch (err) {
    job.durationMs = Date.now() - startTs;
    if (job.attempts <= job.maxRetries) {
      job.status = JobStatus.QUEUED;
      queue.push(job);
    } else {
      job.status = JobStatus.FAILED;
      job.errorCode = err.code || 'EXECUTION_FAILED';
      job.error = err.message ? redactSensitive(err.message) : 'Job failed';
      job.completedAt = new Date().toISOString();
    }
    return job;
  }
}

/**
 * Get job status by ID.
 *
 * @param {string} jobId
 */
export function getJob(jobId) {
  return activeJobs.get(jobId) || null;
}

/**
 * List all jobs with optional filtering.
 *
 * @param {object} [filters]
 * @param {string} [filters.status]
 * @param {string} [filters.type]
 * @param {number} [filters.limit=50]
 * @returns {object[]}
 */
export function listJobs({ status, type, limit = 50 } = {}) {
  let jobs = Array.from(activeJobs.values());

  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }
  if (type) {
    jobs = jobs.filter(j => j.type === type);
  }

  // Sort descending by creation date
  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return jobs.slice(0, limit);
}

/**
 * Cancel a queued job.
 *
 * @param {string} jobId
 * @returns {object|null}
 */
export function cancelJob(jobId) {
  const job = activeJobs.get(jobId);
  if (!job) return null;

  if (job.status === JobStatus.QUEUED) {
    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date().toISOString();
    // Remove from queue if present
    const idx = queue.findIndex(j => j.id === jobId);
    if (idx !== -1) queue.splice(idx, 1);
    return job;
  }

  return job;
}

/**
 * Retry a failed job.
 *
 * @param {string} jobId
 * @returns {object|null}
 */
export async function retryJob(jobId) {
  const job = activeJobs.get(jobId);
  if (!job) return null;

  if (job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED) {
    job.status = JobStatus.QUEUED;
    job.error = null;
    job.errorCode = null;
    job.startedAt = null;
    job.completedAt = null;
    job.attempts = 0;

    queue.push(job);
    scheduleWorker();
    return job;
  }

  return job;
}

/**
 * Clear queue (useful for test resets).
 */
export function resetJobQueue() {
  queue.length = 0;
  activeJobs.clear();
  isWorkerRunning = false;
}
