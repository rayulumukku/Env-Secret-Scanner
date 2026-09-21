/**
 * app/api/security/automation/health/route.js
 *
 * GET /api/security/automation/health
 * Returns factual operational metrics and health status for automation pipeline.
 */

import { NextResponse } from 'next/server';
import { getAutomationHealthMetrics } from '@/lib/automation/health';

export async function GET() {
  try {
    const health = getAutomationHealthMetrics();
    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
