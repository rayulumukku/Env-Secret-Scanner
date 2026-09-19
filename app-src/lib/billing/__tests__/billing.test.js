import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getPlan, getAllPlans, PLANS } from '../plans.js';
import { checkResourceQuota, getOrganizationQuotaSummary } from '../limits.js';
import { getUsageMetrics } from '../usage.js';

describe('Billing & Usage Quota Module', () => {
  test('retrieves valid plans and defaults to Free', () => {
    const freePlan = getPlan('free');
    assert.equal(freePlan.id, 'free');
    assert.ok(freePlan.features.length > 0);

    const teamPlan = getPlan('team');
    assert.equal(teamPlan.id, 'team');

    const unknown = getPlan('non-existent');
    assert.equal(unknown.id, 'free');

    const all = getAllPlans();
    assert.equal(all.length, 3);
  });

  test('validates resource quotas accurately', () => {
    const within = checkResourceQuota({
      planId: 'free',
      metric: 'maxRepositories',
      currentUsage: 4,
    });
    assert.equal(within.withinQuota, true);
    assert.equal(within.percentage, 40);

    const exceeded = checkResourceQuota({
      planId: 'free',
      metric: 'maxRepositories',
      currentUsage: 10,
    });
    assert.equal(exceeded.withinQuota, false);
    assert.equal(exceeded.percentage, 100);

    const unlimited = checkResourceQuota({
      planId: 'enterprise',
      metric: 'maxRepositories',
      currentUsage: 500,
    });
    assert.equal(unlimited.withinQuota, true);
    assert.equal(unlimited.unlimited, true);
  });

  test('aggregates safe usage metrics from database / store', async () => {
    const metrics = await getUsageMetrics();
    assert.ok(typeof metrics.repositoriesCount === 'number');
    assert.ok(typeof metrics.filesScanned === 'number');
    assert.ok(typeof metrics.scansCompleted === 'number');
    assert.ok(typeof metrics.findingsDetected === 'number');
  });
});
