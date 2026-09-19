import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFindingPriority, prioritizeFindings } from '../priority-engine.js';

test('priority-engine - computes high score and P0 for critical credential in current source', () => {
  const finding = {
    id: 'f-1',
    severity: 'CRITICAL',
    confidence: 95,
    file: 'src/config/aws.env',
    branch: 'main',
    isCurrentHead: true
  };

  const res = calculateFindingPriority(finding);
  assert.ok(res.priorityScore >= 80, `Expected score >= 80, got ${res.priorityScore}`);
  assert.equal(res.priorityLevel, 'P0_IMMEDIATE');
  assert.ok(res.priorityFactors.length > 0);
  assert.ok(res.priorityFactors.some(f => f.includes('Critical severity')));
  assert.ok(res.priorityFactors.some(f => f.includes('sensitive configuration file')));
});

test('priority-engine - lowers score for historical-only and low confidence findings', () => {
  const finding = {
    id: 'f-2',
    severity: 'LOW',
    confidence: 40,
    file: 'test/sample.txt',
    branch: 'feature-branch',
    isHistoricalOnly: true,
    exposureStatus: 'REMOVED'
  };

  const res = calculateFindingPriority(finding, { isCurrentHead: false });
  assert.ok(res.priorityScore < 50, `Expected score < 50, got ${res.priorityScore}`);
  assert.equal(res.priorityLevel, 'P3_LOW');
  assert.ok(res.priorityFactors.some(f => f.includes('Historical commit exposure only')));
});

test('priority-engine - prioritizes array of findings in descending score order', () => {
  const findings = [
    { id: 'low-1', severity: 'LOW', confidence: 50, file: 'docs/readme.md' },
    { id: 'crit-1', severity: 'CRITICAL', confidence: 95, file: '.env' },
    { id: 'med-1', severity: 'MEDIUM', confidence: 80, file: 'server.js' }
  ];

  const prioritized = prioritizeFindings(findings);
  assert.equal(prioritized.length, 3);
  assert.equal(prioritized[0].id, 'crit-1');
  assert.equal(prioritized[0].priorityLevel, 'P0_IMMEDIATE');
  assert.ok(prioritized[0].priorityScore >= prioritized[1].priorityScore);
  assert.ok(prioritized[1].priorityScore >= prioritized[2].priorityScore);
});
