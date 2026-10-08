/**
 * @file extension.test.js
 * @description Unit tests for SecretShield VS Code extension foundation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSeverityToVsCode,
  createDiagnosticFromFinding,
  createHoverMarkdown,
  formatRuntimeExposureChain,
  formatDependencyManifestStatus,
  SecretShieldTreeDataProvider,
  SecretShieldTreeItem,
  scanDocument
} from '../extension.js';

describe('VS Code Extension - Core Logic', () => {
  const mockVsCodeApi = {
    DiagnosticSeverity: {
      Error: 0,
      Warning: 1,
      Information: 2,
      Hint: 3
    },
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2
    },
    Range: class {
      constructor(startLine, startChar, endLine, endChar) {
        this.start = { line: startLine, character: startChar };
        this.end = { line: endLine, character: endChar };
      }
    },
    Diagnostic: class {
      constructor(range, message, severity) {
        this.range = range;
        this.message = message;
        this.severity = severity;
      }
    },
    Uri: {
      parse: (str) => ({ toString: () => str }),
      file: (str) => ({ fsPath: str, toString: () => `file://${str}` })
    }
  };

  it('mapSeverityToVsCode maps severities accurately', () => {
    assert.strictEqual(mapSeverityToVsCode('CRITICAL', mockVsCodeApi), 0); // Error
    assert.strictEqual(mapSeverityToVsCode('HIGH', mockVsCodeApi), 0); // Error
    assert.strictEqual(mapSeverityToVsCode('MEDIUM', mockVsCodeApi), 1); // Warning
    assert.strictEqual(mapSeverityToVsCode('LOW', mockVsCodeApi), 2); // Information
  });

  it('createDiagnosticFromFinding generates valid diagnostic object', () => {
    const finding = {
      ruleId: 'aws-access-key-id',
      ruleName: 'AWS Access Key ID',
      severity: 'CRITICAL',
      confidence: 0.95,
      line: 12,
      column: 5,
      maskedValue: 'AKIA****************',
      remediationGuidance: 'Revoke key in AWS IAM Console'
    };

    const doc = { fileName: '/app/config.env' };
    const diag = createDiagnosticFromFinding(finding, doc, mockVsCodeApi);

    assert.strictEqual(diag.severity, 0); // Error
    assert.strictEqual(diag.source, 'SecretShield');
    assert.match(diag.message, /\[CRITICAL\] AWS Access Key ID/);
    assert.match(diag.message, /AKIA\*\*\*\*\*\*\*\*/);
    assert.strictEqual(diag.range.start.line, 11); // 0-based
    assert.strictEqual(diag.range.start.character, 4);
  });

  it('createHoverMarkdown renders rich markdown without raw secret', () => {
    const finding = {
      ruleId: 'github-personal-access-token',
      ruleName: 'GitHub Personal Access Token',
      severity: 'HIGH',
      confidence: 0.99,
      line: 3,
      column: 1,
      maskedValue: 'ghp_************************************',
      entropy: 4.8,
      description: 'GitHub Personal Access Token for API auth',
      remediationGuidance: 'Revoke token on github.com/settings/tokens'
    };

    const md = createHoverMarkdown(finding);
    assert.match(md, /### 🛡️ SecretShield: GitHub Personal Access Token/);
    assert.match(md, /ghp_\*{36}/);
    assert.match(md, /Shannon Entropy/);
    assert.match(md, /Exposure Chain/);
    assert.match(md, /Scanned 100% locally/);
    // Ensure raw secret is not present
    assert.doesNotMatch(md, /ghp_EXAMPLETOKEN/);
  });

  it('formatRuntimeExposureChain formats concise Source -> Commit -> Deployment -> Environment chain', () => {
    const chain1 = formatRuntimeExposureChain({
      sourceStatus: 'Detected in source',
      commitHash: '9f31a23e45',
      deployment: { id: '184' },
      environment: 'staging',
    });
    assert.strictEqual(chain1, 'Detected in source → Commit 9f31a23 → Deployment #184 → Environment: staging');

    const chain2 = formatRuntimeExposureChain({
      sourceStatus: 'Detected in source',
      commitHash: 'abc1234',
    });
    assert.strictEqual(chain2, 'Detected in source → Commit abc1234 → Production status unknown');
  });

  it('SecretShieldTreeDataProvider manages file findings hierarchy', () => {
    const provider = new SecretShieldTreeDataProvider(mockVsCodeApi);
    
    const findings = [
      {
        ruleId: 'slack-incoming-webhook',
        ruleName: 'Slack Webhook',
        severity: 'HIGH',
        line: 5,
        column: 1,
        maskedValue: 'https://hooks.slack.com/services/T*****/B*****/****'
      },
      {
        ruleId: 'generic-api-key',
        ruleName: 'Generic API Key',
        severity: 'MEDIUM',
        line: 10,
        column: 8,
        maskedValue: 'api_key_****'
      }
    ];

    provider.setFileFindings('/src/notifications.js', findings);

    assert.strictEqual(provider.totalFindings, 2);

    // Root children should list the file
    const rootChildren = provider.getChildren();
    assert.strictEqual(rootChildren.length, 1);
    assert.strictEqual(rootChildren[0].label, 'notifications.js');
    assert.strictEqual(rootChildren[0].contextValue, 'file');

    // Children of the file node
    const fileChildren = provider.getChildren(rootChildren[0]);
    assert.strictEqual(fileChildren.length, 2);
    assert.match(fileChildren[0].label, /Line 5: Slack Webhook/);
    assert.strictEqual(fileChildren[0].contextValue, 'finding');
    assert.match(fileChildren[1].label, /Line 10: Generic API Key/);

    // Clear
    provider.clear();
    assert.strictEqual(provider.totalFindings, 0);
    assert.strictEqual(provider.getChildren().length, 0);
  });

  it('scanDocument detects synthetic secret in mock document', () => {
    // Synthetic safe fake key for test
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const mockDoc = {
      fileName: '/src/aws-client.js',
      uri: { fsPath: '/src/aws-client.js' },
      getText: () => `// Test config\nconst awsKey = "${fakeKey}";\nexport default awsKey;`
    };

    let setUri = null;
    let setDiagnostics = null;
    const mockDiagnosticsCollection = {
      set: (uri, diags) => {
        setUri = uri;
        setDiagnostics = diags;
      }
    };

    const treeProvider = new SecretShieldTreeDataProvider(mockVsCodeApi);

    const findings = scanDocument(mockDoc, mockDiagnosticsCollection, treeProvider, { severityThreshold: 'LOW' }, mockVsCodeApi);

    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, 'AWS_ACCESS_KEY_ID');
    assert.strictEqual(findings[0].severity, 'CRITICAL');
    assert.strictEqual(findings[0].line, 2);
    assert.match(findings[0].maskedValue, /AKIA.*MPLE/);

    assert.strictEqual(setDiagnostics.length, 1);
    assert.strictEqual(treeProvider.totalFindings, 1);
  });

  it('scanDocument respects severity threshold', () => {
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const mockDoc = {
      fileName: '/src/test.js',
      uri: { fsPath: '/src/test.js' },
      getText: () => `const key = "${fakeKey}";`
    };

    const mockDiagnosticsCollection = { set: () => {} };
    const treeProvider = new SecretShieldTreeDataProvider(mockVsCodeApi);

    // AWS key is CRITICAL, so filtering by HIGH should still include it
    const findingsHigh = scanDocument(mockDoc, mockDiagnosticsCollection, treeProvider, { severityThreshold: 'HIGH' }, mockVsCodeApi);
    assert.strictEqual(findingsHigh.length, 1);
  });

  it('formatDependencyManifestStatus formats clean and vulnerable status messages', () => {
    const cleanStatus = formatDependencyManifestStatus('package.json', [{ name: 'lodash' }], []);
    assert.ok(cleanStatus.includes('Clean'));
    assert.ok(cleanStatus.includes('1 dependencies'));

    const vulnStatus = formatDependencyManifestStatus('package.json', [{ name: 'lodash' }], [{ id: 'GHSA-123' }]);
    assert.ok(vulnStatus.includes('1 vulnerability(ies) detected'));
  });
});
