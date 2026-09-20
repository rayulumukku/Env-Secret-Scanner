/**
 * app/api/exposure/route.js
 *
 * GET /api/exposure
 * Lists normalized Exposure Clusters with pagination, status filters, and factual metrics.
 */

import { NextResponse } from 'next/server';
import { listExposureClusters } from '@/lib/db/exposure';
import { calculateExposureMetrics } from '@/lib/exposure/metrics';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const repositoryId = searchParams.get('repositoryId');
    const status = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { clusters, total } = await listExposureClusters({
      organizationId,
      repositoryId,
      status,
      limit,
      offset,
    });

    const metrics = calculateExposureMetrics(
      clusters.flatMap(c => c.findings || []),
      clusters
    );

    return NextResponse.json({
      success: true,
      data: {
        clusters,
        metrics,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + clusters.length < total,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
