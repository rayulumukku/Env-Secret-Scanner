/**
 * app/api/settings/data-retention/route.js
 *
 * REST API for Organization Data Retention Policy Configuration.
 */

import { NextResponse } from 'next/server';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// In-memory policy storage defaults
let retentionPolicy = {
  scanMetadataDays: 180,
  auditLogsDays: 365,
  webhookDeliveriesDays: 30,
  notificationsDays: 90,
  integrationEventsDays: 90,
  deleteFindingsWithScans: false, // Invariant: Never automatically delete findings without explicit policy
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  return jsonSuccess(retentionPolicy);
}

export async function POST(request) {
  try {
    const body = await request.json();

    retentionPolicy = {
      ...retentionPolicy,
      scanMetadataDays: Number(body.scanMetadataDays) || retentionPolicy.scanMetadataDays,
      auditLogsDays: Number(body.auditLogsDays) || retentionPolicy.auditLogsDays,
      webhookDeliveriesDays: Number(body.webhookDeliveriesDays) || retentionPolicy.webhookDeliveriesDays,
      notificationsDays: Number(body.notificationsDays) || retentionPolicy.notificationsDays,
      integrationEventsDays: Number(body.integrationEventsDays) || retentionPolicy.integrationEventsDays,
      deleteFindingsWithScans: Boolean(body.deleteFindingsWithScans),
      updatedAt: new Date().toISOString(),
    };

    return jsonSuccess({
      message: 'Data retention policy updated successfully',
      policy: retentionPolicy,
    });
  } catch (err) {
    return jsonError('Failed to update data retention policy', 'DATA_RETENTION_ERROR', 500);
  }
}
