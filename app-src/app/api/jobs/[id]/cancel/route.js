/**
 * app/api/jobs/[id]/cancel/route.js
 *
 * REST API to cancel a queued background job.
 */

import { cancelJob, getJob } from '@/lib/jobs/queue';
import { jsonSuccess, jsonNotFound, jsonError } from '@/lib/api-response';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const existing = getJob(id);
    if (!existing) {
      return jsonNotFound('Job not found');
    }

    const cancelledJob = cancelJob(id);
    return jsonSuccess({
      message: 'Job cancelled',
      job: cancelledJob,
    });
  } catch (err) {
    return jsonError('Failed to cancel job', 'JOB_CANCEL_ERROR', 500);
  }
}
