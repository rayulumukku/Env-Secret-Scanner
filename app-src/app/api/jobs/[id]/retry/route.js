/**
 * app/api/jobs/[id]/retry/route.js
 *
 * REST API to retry a failed background job.
 */

import { retryJob, getJob } from '@/lib/jobs/queue';
import { jsonSuccess, jsonNotFound, jsonError } from '@/lib/api-response';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const existing = getJob(id);
    if (!existing) {
      return jsonNotFound('Job not found');
    }

    const retriedJob = await retryJob(id);
    return jsonSuccess({
      message: 'Job re-enqueued for execution',
      job: retriedJob,
    });
  } catch (err) {
    return jsonError('Failed to retry job', 'JOB_RETRY_ERROR', 500);
  }
}
