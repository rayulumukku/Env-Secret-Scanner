/**
 * app/api/security/graph/[fingerprint]/route.js
 *
 * GET /api/security/graph/[fingerprint]
 * Generates a focused attack-path dependency subgraph for a specific secret fingerprint.
 */

import { NextResponse } from 'next/server';
import { generateExposureGraph } from '@/lib/exposure/graph';
import { getExposureClusterByFingerprint } from '@/lib/db/exposure';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    const { fingerprint } = await params;

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: { message: 'Fingerprint is required' } },
        { status: 400 }
      );
    }

    const cluster = await getExposureClusterByFingerprint(fingerprint, {
      organizationId: user?.organizationId || null,
    });

    if (!cluster) {
      return NextResponse.json(
        { success: false, error: { message: `Fingerprint ${fingerprint} not found` } },
        { status: 404 }
      );
    }

    const graph = generateExposureGraph({
      findings: cluster.findings || [],
      context: {
        organizationId: cluster.organizationId,
      },
      focusFingerprint: fingerprint,
      maxDepth: 5,
      maxNodes: 80,
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
