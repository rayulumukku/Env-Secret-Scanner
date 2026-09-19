/**
 * app/api/settings/usage/route.js
 *
 * Safe usage metrics endpoint querying persistent database records.
 * Returns aggregate counts only. NEVER returns raw secrets or repository data.
 */

import { NextResponse } from 'next/server';
import { getUsageMetrics } from '@/lib/billing/usage';
import { getOrganizationQuotaSummary } from '@/lib/billing/limits';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || null;

    const metrics = await getUsageMetrics(orgId);
    const quotaSummary = getOrganizationQuotaSummary('free', {
      repositories: metrics.repositoriesCount,
      projects: metrics.projectsCount,
      members: metrics.membersCount,
      scansThisMonth: metrics.scansCompleted,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        quota: quotaSummary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve usage metrics' },
      { status: 500 }
    );
  }
}
