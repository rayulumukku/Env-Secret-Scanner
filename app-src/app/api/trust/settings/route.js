/**
 * app/api/trust/settings/route.js
 *
 * GET: Retrieve organization trust settings and review intervals.
 * POST: Update trust settings and public center visibility.
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/context.js';
import { getTrustSettingDb, saveTrustSettingDb } from '@/lib/db/trust.js';
import { logAuditEvent } from '@/lib/db/audit.js';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const settings = await getTrustSettingDb(orgId);
    return NextResponse.json({ success: true, data: { settings } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const body = await request.json();
    const updates = {};

    if (body.publicCenterEnabled !== undefined) updates.publicCenterEnabled = Boolean(body.publicCenterEnabled);
    if (body.organizationSlug) updates.organizationSlug = body.organizationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (body.publicName) updates.publicName = body.publicName.trim();
    if (body.securityContactEmail !== undefined) updates.securityContactEmail = body.securityContactEmail;
    if (body.securityContactUrl !== undefined) updates.securityContactUrl = body.securityContactUrl;
    if (body.accessReviewIntervalDays !== undefined) updates.accessReviewIntervalDays = Number(body.accessReviewIntervalDays);
    if (body.policyReviewIntervalDays !== undefined) updates.policyReviewIntervalDays = Number(body.policyReviewIntervalDays);
    if (body.securityTestIntervalDays !== undefined) updates.securityTestIntervalDays = Number(body.securityTestIntervalDays);
    if (body.integrationReviewDays !== undefined) updates.integrationReviewDays = Number(body.integrationReviewDays);

    const saved = await saveTrustSettingDb(orgId, updates);

    await logAuditEvent({
      organizationId: orgId,
      userId: auth.user?.id || 'admin',
      action: 'TRUST_SETTINGS_UPDATED',
      targetType: 'TRUST_SETTINGS',
      targetId: saved.id,
      metadata: { publicCenterEnabled: saved.publicCenterEnabled, slug: saved.organizationSlug },
    });

    return NextResponse.json({ success: true, data: { settings: saved } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
