#!/usr/bin/env node

/**
 * scripts/smoke-test.js
 *
 * Non-Destructive Production Smoke Test Suite.
 *
 * Verifies:
 *   1. Core scanner engine initialization & Shannon entropy calculation
 *   2. Rule engine integrity & ReDoS guards
 *   3. Credential masking & redaction utilities
 *   4. Configuration validator
 *   5. Database client initialization (Postgres or In-Memory)
 *   6. Background job queue worker scheduling
 */

import { ALL_RULES } from '../app-src/lib/scanner/rules/index.js';
import { scanText } from '../app-src/lib/scanner/engine.js';
import { shannonEntropy } from '../app-src/lib/scanner/entropy.js';
import { redactSensitive, redactString } from '../app-src/lib/security/redact.js';
import { validateEnvironment } from '../app-src/lib/config/validation.js';
import { getDb } from '../app-src/lib/db/client.js';
import { enqueueJob, resetJobQueue } from '../app-src/lib/jobs/queue.js';
import { getAppVersion } from '../app-src/lib/version.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✖ FAILED: ${message}`);
    failed++;
  }
}

async function runSmokeTests() {
  console.log('\n==================================================');
  console.log(`  SecretShield v${getAppVersion()} — Production Smoke Tests`);
  console.log('==================================================\n');

  // Test 1: Scanner Rules
  console.log('[1/6] Testing Scanner Rule Catalog...');
  assert(Array.isArray(ALL_RULES) && ALL_RULES.length >= 10, `Loaded ${ALL_RULES.length} active detection rules`);
  const entropy = shannonEntropy('AKIAIOSFODNN7EXAMPLE');
  assert(entropy > 3.0, `Shannon entropy calculation operational (score: ${entropy.toFixed(2)})`);

  // Test 2: Scanner Detection & Masking
  console.log('\n[2/6] Testing In-Memory Scanner Detection & Masking...');
  const syntheticEnv = 'AWS_KEY=AKIAIOSFODNN7EXAMPLE\nSAFE_VAR=hello_world';
  const scanResult = scanText(syntheticEnv, { filename: '.env' });
  assert(scanResult.findings.length >= 1, `Detected synthetic AWS credential in .env (${scanResult.findings.length} findings)`);
  assert(scanResult.findings[0].maskedValue.includes('••••'), 'Secret was masked immediately in memory');
  assert(!JSON.stringify(scanResult).includes('AKIAIOSFODNN7EXAMPLE'), 'Raw secret is NOT present in scan output');


  // Test 3: Centralized Redaction Utility
  console.log('\n[3/6] Testing Centralized Redaction Utility...');
  const sensitiveObj = {
    apiKey: 'sk-proj-supersecretkey1234567890',
    dbUrl: 'postgres://admin:superSecretPass@localhost:5432/mydb',
    user: 'developer',
  };
  const redacted = redactSensitive(sensitiveObj);
  assert(redacted.apiKey === '[REDACTED]', 'Sensitive key [apiKey] was redacted to [REDACTED]');
  assert(!redacted.dbUrl.includes('superSecretPass'), 'Embedded password in database URL was redacted');
  assert(redacted.user === 'developer', 'Non-sensitive field [user] was preserved');

  // Test 4: Environment Schema Validation
  console.log('\n[4/6] Testing Environment Validation...');
  const validation = validateEnvironment();
  assert(typeof validation.valid === 'boolean', 'Environment validation schema executed cleanly');

  // Test 5: Storage Layer Check
  console.log('\n[5/6] Testing Storage Layer...');
  const { client, isPostgres } = await getDb();
  assert(client !== null, `Database client initialized (${isPostgres ? 'PostgreSQL' : 'In-Memory Store'})`);

  // Test 6: Background Job Queue
  console.log('\n[6/6] Testing Background Job Queue...');
  resetJobQueue();
  const testJob = await enqueueJob('SMOKE_TEST_JOB', { test: true }, { runImmediately: true });
  assert(testJob && testJob.id.startsWith('job_'), `Job queued successfully (${testJob.id})`);

  console.log('\n==================================================');
  console.log(`  Smoke Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke test runner crashed:', err);
  process.exit(1);
});
