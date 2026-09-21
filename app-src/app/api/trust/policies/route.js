/**
 * app/api/trust/policies/route.js
 *
 * GET: List organization policies with optional category / status filter.
 * POST: Create a new custom policy or draft policy.
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/context.js';
import { listTrustPoliciesDb, saveTrustPolicyDb } from '@/lib/db/trust.js';
import { logAuditEvent } from '@/lib/db/audit.js';
import { randomUUID } from 'crypto';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || null;
    const status = searchParams.get('status') || null;

    const policies = await listTrustPoliciesDb({
      organizationId: orgId,
      category,
      status,
    });

    return NextResponse.json({
      success: true,
      data: { policies, total: policies.length },
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
    const { category, title, summary, content, owner, version = '1.0.0', status = 'DRAFT' } = body;

    if (!category || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Category, title, and content are required' },
        { status: 400 }
      );
    }

    const policy = {
      id: `pol_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      organizationId: orgId,
      category,
      title,
      summary: summary || '',
      content,
      owner: owner || auth.user?.name || auth.user?.email || 'Security Lead',
      version,
      status,
      effectiveDate: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      approver: null,
      changeSummary: 'Initial policy creation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await saveTrustPolicyDb(policy);

    await logAuditEvent({
      organizationId: orgId,
      userId: auth.user?.id || 'admin',
      action: 'TRUST_POLICY_CREATED',
      targetType: 'TRUST_POLICY',
      targetId: created.id,
      metadata: { title: created.title, category: created.category, status: created.status },
    });

    return NextResponse.json({ success: true, data: { policy: created } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
