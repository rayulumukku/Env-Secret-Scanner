/**
 * app/api/trust/incidents/route.js
 *
 * GET: Retrieve security incident timelines, playbooks, lessons learned, and evidence packages.
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/context.js';
import { listSecurityIncidents, listPlaybooks } from '@/lib/db/automation.js';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    const orgId = auth.organization?.id || auth.user?.organizationId || 'default-org';

    const [incidents, playbooks] = await Promise.all([
      listSecurityIncidents({ organizationId: orgId }),
      listPlaybooks({ organizationId: orgId }),
    ]);

    const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'TRIAGED' || i.status === 'CONTAINED');
    const closedIncidents = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED');

    return NextResponse.json({
      success: true,
      data: {
        totalIncidents: incidents.length,
        openCount: openIncidents.length,
        closedCount: closedIncidents.length,
        openIncidents,
        closedIncidents,
        playbooks,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
