/**
 * app/api/trust/policies/[id]/route.js
 *
 * GET: Retrieve single policy.
 * PATCH: Update policy content, version, or transition status (DRAFT -> REVIEW -> APPROVAL -> ACTIVE -> RETIRED).
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/context.js';
import { getTrustPolicyByIdDb, updateTrustPolicyDb } from '@/lib/db/trust.js';
import { validatePolicyTransition } from '@/lib/trust/policies.js';
import { logAuditEvent } from '@/lib/db/audit.js';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const { id } = await params;
    const policy = await getTrustPolicyByIdDb(id, orgId);
    if (!policy) {
      return NextResponse.json({ success: false, error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { policy } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const { id } = await params;
    const existing = await getTrustPolicyByIdDb(id, orgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Policy not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};

    if (body.title) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.content) updates.content = body.content;
    if (body.owner) updates.owner = body.owner;
    if (body.version) updates.version = body.version;
    if (body.changeSummary) updates.changeSummary = body.changeSummary;

    // Validate workflow transition if status is being changed
    if (body.status && body.status !== existing.status) {
      const validation = validatePolicyTransition(existing.status, body.status);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'ACTIVE') {
        updates.approver = auth.user?.name || auth.user?.email || 'Security Lead';
        updates.effectiveDate = new Date().toISOString();
      }
    }

    const updated = await updateTrustPolicyDb(id, orgId, updates);

    await logAuditEvent({
      organizationId: orgId,
      userId: auth.user?.id || 'admin',
      action: 'TRUST_POLICY_UPDATED',
      targetType: 'TRUST_POLICY',
      targetId: id,
      metadata: { previousStatus: existing.status, newStatus: updated.status, version: updated.version },
    });

    return NextResponse.json({ success: true, data: { policy: updated } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
