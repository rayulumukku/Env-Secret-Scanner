/**
 * app/api/security/automation/simulate/route.js
 *
 * POST /api/security/automation/simulate
 * Simulates playbook and policy evaluation against synthetic or selected events without side effects.
 */

import { NextResponse } from 'next/server';
import { simulatePlaybookRun } from '@/lib/automation/playbooks';
import { listPlaybooks } from '@/lib/db/automation';
import { createSecurityEvent, SECURITY_EVENT_TYPES, EVENT_SOURCES } from '@/lib/automation/events';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const organizationId = body.organizationId || user?.organizationId || 'default-org';

    // Construct synthetic event
    const syntheticEvent = createSecurityEvent({
      organizationId,
      eventType: body.eventType || SECURITY_EVENT_TYPES.SECRET_DETECTED,
      source: body.source || EVENT_SOURCES.MANUAL_SCAN,
      repositoryId: body.repositoryId || 'repo_simulation',
      severity: body.severity || 'HIGH',
      category: body.category || 'API_KEY',
      metadata: {
        branch: body.branch || 'main',
        isProduction: body.isProduction !== false,
        ruleCategory: body.category || 'API_KEY',
        ...body.metadata,
      },
    });

    // Fetch active playbooks or use provided custom playbooks
    let playbooks = body.playbooks;
    if (!playbooks || playbooks.length === 0) {
      playbooks = await listPlaybooks({ organizationId, isEnabled: true });
    }

    const context = {
      isProduction: body.isProduction !== false,
      repositoryName: body.repositoryName || 'demo-service',
      branch: body.branch || 'main',
      tags: body.tags || ['production'],
    };

    const simulationResult = simulatePlaybookRun(syntheticEvent, playbooks, context);

    return NextResponse.json({
      success: true,
      data: simulationResult,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
