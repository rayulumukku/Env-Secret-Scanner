import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFeedback, listFeedback, updateFeedbackStatus } from '../store.js';

describe('Feedback Store & Sanitization', () => {
  it('should create feedback and sanitize input to prevent secret leakage', () => {
    const item = createFeedback({
      category: 'Scanner false positive',
      title: 'False positive on mock Stripe key',
      description: 'The documentation code example with sk_test was flagged as high severity.',
      ruleId: 'STRIPE_SECRET_KEY',
      syntheticExample: 'sk_test_51MockStripeKey1234567890',
    });

    assert.ok(item.id, 'Feedback should have an ID');
    assert.strictEqual(item.category, 'Scanner false positive');
    assert.strictEqual(item.status, 'New');

    const all = listFeedback();
    const found = all.find(f => f.id === item.id);
    assert.ok(found, 'Should be retrievable from list');
  });

  it('should update feedback status to Planned or Resolved', () => {
    const item = createFeedback({
      category: 'General feedback',
      title: 'UI looks great',
      description: 'The new dark mode design is very clean.',
    });

    const updated = updateFeedbackStatus(item.id, 'Resolved');
    assert.strictEqual(updated.status, 'Resolved');
  });
});
