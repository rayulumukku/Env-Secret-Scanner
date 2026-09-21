/**
 * app/api/trust/ai/route.js
 *
 * GET: Retrieve AI privacy posture, secret redaction status, and data minimization settings.
 * POST: Update AI privacy configurations.
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/context.js';
import { logAuditEvent } from '@/lib/db/audit.js';

let _aiSettings = {
  aiEnabled: false,
  configuredProvider: 'None (Pure Deterministic Engine)',
  allowedRoles: ['ADMIN', 'SECURITY_OFFICER'],
  dataMinimization: 'STRICT',
  secretRedactionStatus: 'ACTIVE_PRE_TRANSMISSION',
  requestLimits: '50 req/day per org',
  providerConfigurationStatus: 'OPTIONAL_UNCONFIGURED',
  deterministicFallback: true,
  zeroTrainingAgreement: true,
};

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    return NextResponse.json({
      success: true,
      data: {
        settings: _aiSettings,
        notice: 'SecretShield core detection operates 100% deterministically without external AI models. AI triage is strictly optional and redacts all secrets before invocation.',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const body = await request.json();

    if (body.aiEnabled !== undefined) _aiSettings.aiEnabled = Boolean(body.aiEnabled);
    if (body.configuredProvider !== undefined) _aiSettings.configuredProvider = body.configuredProvider;
    if (body.dataMinimization !== undefined) _aiSettings.dataMinimization = body.dataMinimization;
    if (body.deterministicFallback !== undefined) _aiSettings.deterministicFallback = Boolean(body.deterministicFallback);

    await logAuditEvent({
      organizationId: orgId,
      userId: auth.user?.id || 'admin',
      action: 'AI_PRIVACY_SETTINGS_UPDATED',
      targetType: 'AI_SETTINGS',
      targetId: 'ai_privacy_config',
      metadata: { aiEnabled: _aiSettings.aiEnabled, provider: _aiSettings.configuredProvider },
    });

    return NextResponse.json({ success: true, data: { settings: _aiSettings } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
