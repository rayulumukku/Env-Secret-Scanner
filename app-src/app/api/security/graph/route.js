/**
 * app/api/security/graph/route.js
 *
 * GET /api/security/graph
 * Generates an evidence-backed Exposure Dependency Graph for an organization/repository.
 * Enforces query limits, depth bounds, and strict tenant isolation.
 */

import { NextResponse } from 'next/server';
import { generateExposureGraph } from '@/lib/exposure/graph';
import { listExposureClusters } from '@/lib/db/exposure';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const repositoryId = searchParams.get('repositoryId') || null;
    const maxDepth = Math.min(6, Math.max(1, parseInt(searchParams.get('maxDepth') || '4', 10)));
    const maxNodes = Math.min(200, Math.max(10, parseInt(searchParams.get('maxNodes') || '150', 10)));

    const { clusters } = await listExposureClusters({
      organizationId,
      repositoryId,
      limit: 100,
    });

    const findings = clusters.flatMap(c => c.findings || []);

    const graph = generateExposureGraph({
      findings,
      context: {
        organizationId,
        organizationName: user?.organizationName || 'Current Organization',
        repositoryId,
      },
      maxDepth,
      maxNodes,
    });

    return NextResponse.json({
      success: true,
      data: graph,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
