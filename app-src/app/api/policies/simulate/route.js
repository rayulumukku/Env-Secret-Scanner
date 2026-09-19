/**
 * @file app/api/policies/simulate/route.js
 * @description Interactive policy simulation endpoint.
 * 
 * SECURITY INVARIANT:
 *   - Simulation results NEVER trigger PR/CI blocking or real-world notifications.
 *   - Explicitly marked as SIMULATION.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listPolicies, getPolicyById } from '@/lib/db/policies';
import { evaluateTargetPolicies } from '@/lib/policies/engine';

export async function POST(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const body = await req.json();
    const { policyId, finding, repository, pr, scan } = body;

    let targetPolicies = [];
    if (policyId) {
      const p = await getPolicyById(policyId, auth.organization.id);
      if (p) targetPolicies = [p];
    } else {
      targetPolicies = await listPolicies(auth.organization.id, { enabled: true });
    }

    const payload = {
      finding: finding || {
        severity: 'CRITICAL',
        confidence: 95,
        ruleId: 'AWS_SECRET_KEY',
        status: 'OPEN',
        branch: 'main',
        file: 'src/config/aws.env',
        maskedValue: 'AKIA••••••••EXAMPLE'
      },
      repository: repository || {
        id: 'repo_sample',
        name: 'sample-repo',
        isPrivate: true,
        defaultBranch: 'main',
        hasHistoryScanned: true,
        ciEnabled: true
      },
      scan: scan || { type: 'PR', branch: 'main' },
      pr: pr || { number: 42, branch: 'feature-auth' },
      organizationId: auth.organization.id
    };

    const simulationResult = await evaluateTargetPolicies(payload, targetPolicies, {
      isSimulation: true
    });

    return jsonSuccess({
      ...simulationResult,
      isSimulation: true,
      simulationBanner: 'SIMULATION MODE — No real notifications or pipeline blocks were executed.'
    });
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
