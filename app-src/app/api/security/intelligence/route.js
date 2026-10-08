/**
 * @file app/api/security/intelligence/route.js
 * @description Unified security intelligence overview endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { SecurityIntelligenceEngine } from '@/lib/security/security-intelligence';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const engine = new SecurityIntelligenceEngine({ organizationId: auth.organization.id });
  engine.consumeSignals([
    {
      source: 'scanner',
      type: 'SECRET_FINDING',
      severity: 'CRITICAL',
      confidence: 0.94,
      timestamp: new Date().toISOString(),
      entityId: 'repo_core_api',
      entityType: 'REPOSITORY',
      fingerprint: 'sha256:repo_core_api_secret',
      metadata: { file: 'config/.env', secretType: 'API_KEY', rawValue: 'totally-secret-placeholder' },
      correlationKeys: ['repo_core_api', auth.organization.id],
    },
    {
      source: 'control',
      type: 'CONTROL_FAILURE',
      severity: 'HIGH',
      confidence: 0.85,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      entityId: 'control_detections',
      entityType: 'CONTROL',
      fingerprint: 'sha256:control_detections',
      metadata: { control: 'Detection Regression Guard', stage: 'hours' },
      correlationKeys: ['control_detections', auth.organization.id],
    },
  ]);

  return jsonSuccess(engine.buildOverview(auth.organization.id));
}
