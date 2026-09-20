/**
 * app/api/jobs/route.js
 *
 * REST API for Background Job Queue Inspection.
 *
 * Endpoints:
 *   - GET /api/jobs (Query filters: ?status=QUEUED&type=SCAN_PUSH&limit=50)
 */

import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/jobs/queue';
import { jsonSuccess, jsonError } from '@/lib/api-response';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const jobs = listJobs({ status, type, limit });

    return jsonSuccess({
      jobs,
      total: jobs.length,
      filters: { status, type, limit },
    });
  } catch (err) {
    return jsonError('Failed to list background jobs', 'JOB_LIST_ERROR', 500);
  }
}
