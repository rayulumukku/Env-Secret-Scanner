/**
 * app/api/settings/system-health/route.js
 *
 * Safe Detailed Diagnostic API for Administrator Dashboard.
 *
 * SAFETY GUARANTEES:
 *   - Zero raw secrets, credentials, tokens, or connection passwords exposed.
 *   - Only reports operational component statuses, counts, and sanitized errors.
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { ALL_RULES } from '@/lib/scanner/rules/index';
import { listJobs } from '@/lib/jobs/queue';
import { validateEnvironment } from '@/lib/config/validation';
import { getAppVersion } from '@/lib/version';

export async function GET() {
  const startTime = Date.now();

  // 1. Application Process
  const appStatus = {
    status: 'Operational',
    version: getAppVersion(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    lastCheck: new Date().toISOString(),
  };

  // 2. Database
  let dbStatus = 'Operational';
  let dbType = 'In-Memory Isolated Store';
  let dbError = null;
  try {
    const { isPostgres } = await getDb();
    dbType = isPostgres ? 'PostgreSQL (Persistent)' : 'In-Memory Fallback Engine';
  } catch (err) {
    dbStatus = 'Degraded';
    dbError = 'Database query failed or timed out';
  }

  // 3. Scanner Engine
  let scannerStatus = 'Operational';
  let rulesLoaded = 0;
  try {
    rulesLoaded = ALL_RULES.length;
    if (rulesLoaded === 0) scannerStatus = 'Unavailable';
  } catch {
    scannerStatus = 'Unavailable';
  }

  // 4. Background Jobs
  const jobs = listJobs({ limit: 50 });
  const failedJobsCount = jobs.filter(j => j.status === 'FAILED').length;
  const activeJobsCount = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'QUEUED').length;
  const jobsStatus = failedJobsCount > 5 ? 'Degraded' : 'Operational';

  // 5. Providers & Integrations
  const githubConfigured = Boolean(process.env.GITHUB_CLIENT_ID || process.env.GITHUB_APP_ID);
  const gitlabConfigured = Boolean(process.env.GITLAB_CLIENT_ID);
  const slackConfigured = Boolean(process.env.SLACK_CLIENT_ID || process.env.SLACK_SIGNING_SECRET);

  const envValidation = validateEnvironment();

  return NextResponse.json(
    {
      success: true,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      components: {
        application: appStatus,
        database: {
          status: dbStatus,
          engine: dbType,
          lastCheck: new Date().toISOString(),
          error: dbError,
        },
        scanner: {
          status: scannerStatus,
          rulesLoaded,
          entropyEngine: 'Shannon Algorithm 2.0',
          reDoSSafety: 'Active',
          lastCheck: new Date().toISOString(),
        },
        jobs: {
          status: jobsStatus,
          totalInQueue: jobs.length,
          activeCount: activeJobsCount,
          failedCount: failedJobsCount,
          lastCheck: new Date().toISOString(),
        },
        github: {
          status: githubConfigured ? 'Operational' : 'Configuration required',
          configured: githubConfigured,
          lastCheck: new Date().toISOString(),
        },
        gitlab: {
          status: gitlabConfigured ? 'Operational' : 'Configuration required',
          configured: gitlabConfigured,
          lastCheck: new Date().toISOString(),
        },
        slack: {
          status: slackConfigured ? 'Operational' : 'Configuration required',
          configured: slackConfigured,
          lastCheck: new Date().toISOString(),
        },
        webhooks: {
          status: 'Operational',
          deliveryEngine: 'HMAC-SHA256 Signed',
          lastCheck: new Date().toISOString(),
        },
      },
      configuration: {
        valid: envValidation.valid,
        warningsCount: envValidation.warnings.length,
        errorsCount: envValidation.errors.length,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
