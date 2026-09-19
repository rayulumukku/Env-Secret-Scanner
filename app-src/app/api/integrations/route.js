/**
 * app/api/integrations/route.js
 *
 * GET /api/integrations — List integration statuses and health metrics.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { getIntegrationHealth } from '@/lib/db/integrations.js';

export async function GET(req) {
  try {
    const auth = await getAuthContext(req);
    const orgId = auth.currentOrgId || 'default';

    const health = await getIntegrationHealth(orgId);
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
