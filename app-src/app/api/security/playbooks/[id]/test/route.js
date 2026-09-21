/**
 * app/api/security/playbooks/[id]/test/route.js
 *
 * POST /api/security/playbooks/:id/test
 * Evaluates a single playbook against test event criteria.
 */

import { NextResponse } from 'next/server';
import { getPlaybookById } from '@/lib/db/automation';
import { evaluatePlaybook } from '@/lib/automation/playbooks';
import { createSecurityEvent, SECURITY_EVENT_TYPES, EVENT_SOURCES } from '@/lib/automation/events';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json();
    const organizationId = user?.organizationId || 'default-org';

    const playbook = await getPlaybookById(id, organizationId);
    if (!playbook) {
      return NextResponse.json(
        { success: false, error: { message: 'Playbook not found' } },
        { status: 404 }
      );
    }

    const testEvent = createSecurityEvent({
      organizationId,
      eventType: body.eventType || SECURITY_EVENT_TYPES.SECRET_DETECTED,
      source: body.source || EVENT_SOURCES.MANUAL_SCAN,
      repositoryId: body.repositoryId || 'test_repo',
      severity: body.severity || 'HIGH',
      category: body.category || 'API_KEY',
      metadata: {
        branch: body.branch || 'main',
        isProduction: body.isProduction !== false,
        ...body.metadata,
      },
    });

    const evalResult = evaluatePlaybook(playbook, testEvent, {
      isProduction: body.isProduction !== false,
      repositoryName: body.repositoryName || 'test-repo',
      branch: body.branch || 'main',
    });

    return NextResponse.json({
      success: true,
      data: {
        isTest: true,
        evalResult,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
