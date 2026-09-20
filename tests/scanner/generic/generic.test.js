import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from '../../../app-src/lib/scanner/engine.js';

describe('Scanner Regression Suite: Generic Detectors & Patterns', () => {
  describe('Private Key Detection', () => {
    it('detects RSA Private Key Block as CRITICAL (positive)', () => {
      const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Y3...\n-----END RSA PRIVATE KEY-----';
      const res = scanText(pem, { filename: 'id_rsa' });
      const finding = res.findings.find(f => f.type.includes('PRIVATE_KEY') || f.type.includes('RSA'));
      assert.ok(finding);
      assert.equal(finding.severity, 'CRITICAL');
    });

    it('detects OpenSSH Private Key Block (positive)', () => {
      const pem = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAA...\n-----END OPENSSH PRIVATE KEY-----';
      const res = scanText(pem, { filename: 'id_ed25519' });
      assert.ok(res.findings.some(f => f.type.includes('OPENSSH') || f.type.includes('PRIVATE_KEY')));
    });
  });

  describe('Database Connection URLs', () => {
    it('detects PostgreSQL URL with embedded password as CRITICAL (positive)', () => {
      const code = 'const url = "postgresql://dbuser:MySecretDbPass123!@db.internal:5432/mydb";';
      const res = scanText(code, { filename: 'db.js' });
      const finding = res.findings.find(f => f.type.toLowerCase().includes('postgres') || f.type.toLowerCase().includes('database'));
      assert.ok(finding);
      assert.equal(finding.severity, 'CRITICAL');
    });

    it('detects MongoDB connection string with credentials (positive)', () => {
      const code = 'const uri = "mongodb+srv://admin:AdminSuperSecret99@cluster0.mongodb.net/test";';
      const res = scanText(code, { filename: 'mongo.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('mongo') || f.type.toLowerCase().includes('database')));
    });

    it('does NOT flag localhost URL without password (negative)', () => {
      const code = 'const url = "postgresql://localhost:5432/mydb";';
      const res = scanText(code, { filename: 'db.js' });
      assert.equal(res.findings.filter(f => f.type.toLowerCase().includes('database')).length, 0);
    });
  });

  describe('JWT Token Detection', () => {
    it('detects structured JWT token (positive)', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const res = scanText(`const token = "${jwt}";`, { filename: 'auth.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('jwt')));
    });

    it('does not flag arbitrary dot-separated text as JWT (negative)', () => {
      const code = 'const version = "v1.2.3.alpha.release";';
      const res = scanText(code, { filename: 'version.js' });
      assert.equal(res.findings.filter(f => f.type.toLowerCase().includes('jwt')).length, 0);
    });
  });

  describe('Hardcoded Password Assignments', () => {
    it('detects high-entropy password assignments in source code (positive)', () => {
      const code = 'const db_password = "K8#mP$9xV!2qL@zW";';
      const res = scanText(code, { filename: 'config.js' });
      assert.ok(res.findings.some(f => f.type.toLowerCase().includes('password')));
    });

    it('does not flag common dummy values like changeme or placeholder (false positive filter)', () => {
      const code = 'const testPass = "YOUR_PASSWORD_HERE";\nconst dummy = "changeme";';
      const res = scanText(code, { filename: 'test.js' });
      assert.equal(res.findings.filter(f => f.type.toLowerCase().includes('password')).length, 0);
    });
  });
});
