import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPlaceholder } from '../../../app-src/lib/scanner/context.js';
import { scanText } from '../../../app-src/lib/scanner/engine.js';

describe('Scanner Regression Suite: False Positive & Template Filter', () => {
  it('identifies standard template placeholders accurately', () => {
    const placeholders = [
      'YOUR_API_KEY',
      'your-secret-here',
      'changeme',
      'xxxxxxxxxxxxxxxx',
      '<YOUR_TOKEN_HERE>',
      '00000000000000000000',
      'example_api_key_value',
      'MY_SECRET_KEY',
      'TODO_SET_SECRET',
    ];

    for (const ph of placeholders) {
      assert.equal(isPlaceholder(ph), true, `Expected "${ph}" to be recognized as placeholder`);
    }
  });

  it('does not classify real-looking random keys as placeholders', () => {
    const realKeys = [
      'AKIA' + 'IOSFODNN7EXAMPLE',
      'sk_' + 'live_' + '51AbcDefGhIjKlMnOpQrStUvWxYz',
      'ghp_' + '123456789012345678901234567890123456',
    ];

    for (const k of realKeys) {
      assert.equal(isPlaceholder(k), false, `Key "${k}" should NOT be considered placeholder`);
    }
  });

  it('filters out .env.example placeholder variable definitions', () => {
    const exampleEnv = `
# Environment variables example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY_HERE
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
`;
    const res = scanText(exampleEnv, { filename: '.env.example' });
    assert.equal(res.findings.length, 0, 'No findings should be generated for template .env.example with placeholders');
  });
});
