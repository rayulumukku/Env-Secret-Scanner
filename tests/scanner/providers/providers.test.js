import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from '../../../app-src/lib/scanner/engine.js';

describe('Scanner Regression Suite: Provider-Specific Detectors', () => {
  describe('AWS Rules', () => {
    it('detects valid synthetic AWS Access Key ID (positive)', () => {
      const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
      const res = scanText(`const key = "${key}";`, { filename: 'aws.js' });
      assert.ok(res.findings.some(f => f.type.includes('AWS')));
    });

    it('does not flag non-key words (negative)', () => {
      const res = scanText('const key = "MY_NON_AWS_IDENTIFIER";', { filename: 'aws.js' });
      assert.equal(res.findings.filter(f => f.type.includes('AWS')).length, 0);
    });

    it('does not flag template placeholder (false positive)', () => {
      const res = scanText('const key = "AKIA_YOUR_KEY_HERE_EX";', { filename: 'aws.js' });
      assert.equal(res.findings.length, 0);
    });
  });

  describe('GitHub Token Rules', () => {
    it('detects GitHub Classic Personal Access Token (positive)', () => {
      const ghp = 'ghp_' + '123456789012345678901234567890123456';
      const res = scanText(`const ghp = "${ghp}";`, { filename: 'gh.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('github')));
    });

    it('does not flag non-token string starting with ghp (negative)', () => {
      const res = scanText('const text = "ghp_short";', { filename: 'gh.js' });
      assert.equal(res.findings.length, 0);
    });
  });

  describe('Stripe Key Rules', () => {
    it('detects Stripe live secret key as CRITICAL (positive)', () => {
      const key = 'sk_' + 'live_' + '51AbcDefGhIjKlMnOpQrStUvWxYz123456';
      const res = scanText(`const key = "${key}";`, { filename: 'stripe.js' });
      const stripeFinding = res.findings.find(f => f.type.toLowerCase().includes('stripe'));
      assert.ok(stripeFinding);
      assert.equal(stripeFinding.severity, 'CRITICAL');
    });

    it('detects Stripe test key as HIGH (positive)', () => {
      const key = 'sk_' + 'test_' + '51AbcDefGhIjKlMnOpQrStUvWxYz123456';
      const res = scanText(`const key = "${key}";`, { filename: 'stripe.js' });
      const stripeFinding = res.findings.find(f => f.type.toLowerCase().includes('stripe'));
      assert.ok(stripeFinding);
      assert.equal(stripeFinding.severity, 'HIGH');
    });
  });

  describe('Slack Token Rules', () => {
    it('detects Slack Bot Token (positive)', () => {
      const token = 'xoxb-' + '123456789012-' + '1234567890123-' + 'AbCdEfGhIjKlMnOpQrStUvWx';
      const res = scanText(`const token = "${token}";`, { filename: 'slack.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('slack')));
    });

    it('detects Slack Incoming Webhook URL (positive)', () => {
      const hook = 'https://hooks.slack.com/' + 'services/T00000000/' + 'B00000000/' + 'XXXXXXXXXXXXXXXXXXXXXXXX';
      const res = scanText(`const hook = "${hook}";`, { filename: 'slack.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('slack')));
    });
  });

  describe('OpenAI Key Rules', () => {
    it('detects OpenAI Project Key (positive)', () => {
      const key = 'sk-proj-' + 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrSt';
      const res = scanText(`const key = "${key}";`, { filename: 'openai.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('openai')));
    });
  });
});
