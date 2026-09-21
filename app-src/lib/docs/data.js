/**
 * lib/docs/data.js
 *
 * Comprehensive technical documentation content for SecretShield.
 * All details are technically accurate to the real implementation.
 *
 * SAFETY GUARANTEE:
 * All code examples use STRICTLY synthetic/placeholder strings (e.g., AKIAIOSFODNN7EXAMPLE, DEMO_TOKEN_XYZ).
 */

export const DOC_SECTIONS = [
  {
    category: 'Getting Started',
    items: [
      { slug: 'getting-started', title: 'Quickstart Guide', description: 'Get up and running with SecretShield in under 2 minutes.' },
      { slug: 'scanner', title: 'Scanner Engine & Intelligence', description: 'Deep dive into deterministic detection, entropy analysis, and context filtering.' },
      { slug: 'privacy', title: 'Privacy Architecture', description: 'Zero external AI endpoints, local execution, and in-memory credential masking.' },
    ],
  },
  {
    category: 'Developer & CI/CD Tooling',
    items: [
      { slug: 'npm', title: 'Standalone npm Package', description: 'Embed @secretshield/scanner directly into Node.js applications and pipelines.' },
      { slug: 'cli', title: 'CLI & Benchmark Tool', description: 'Run scans, benchmarks, and SARIF exports directly from your terminal.' },
      { slug: 'vscode', title: 'VS Code Extension', description: 'Real-time offline secret scanning in Visual Studio Code.' },
      { slug: 'pre-commit', title: 'Git Pre-Commit Hooks', description: 'Block exposed secrets locally before git commits are written.' },
      { slug: 'github', title: 'GitHub App Integration', description: 'Automated Pull Request scanning, review annotations, and webhook handlers.' },
      { slug: 'gitlab', title: 'GitLab CI Integration', description: 'Scan merge requests and branch pipelines using GitLab webhooks and CI.' },
      { slug: 'github-actions', title: 'GitHub Actions & SARIF', description: 'Automate security checks in GitHub Actions with native SARIF 2.1.0 reporting.' },
    ],
  },
  {
    category: 'Rules & Remediation',
    items: [
      { slug: 'custom-rules', title: 'Custom Regex Rules & Safety', description: 'Define organization-specific rules and protect against ReDoS vulnerabilities.' },
      { slug: 'baseline', title: 'Baseline Suppressions', description: 'Suppress legacy findings using .secretshield-baseline.json.' },
      { slug: 'remediation', title: 'Remediation & Key Rotation', description: 'Step-by-step triage, revocation guides, and finding resolution workflows.' },
    ],
  },
  {
    category: 'API & Reference',
    items: [
      { slug: 'api', title: 'REST API Reference', description: 'Integrate programmatic scanning, findings queries, and status probes.' },
      { slug: 'security', title: 'Security & Threat Matrix', description: 'Security architecture, data isolation, and responsible disclosure policy.' },
      { slug: 'faq', title: 'Technical FAQ', description: 'Answers to frequently asked architecture and performance questions.' },
    ],
  },
  {
    category: 'Operations & Reliability',
    items: [
      { slug: 'operations/backups', title: 'Database Backups & Recovery', description: 'Backup schedules, logical dumps, and point-in-time recovery.' },
      { slug: 'operations/disaster-recovery', title: 'Disaster Recovery Playbook', description: 'Runbooks for process crashes, database failure, and credential rotation.' },
      { slug: 'operations/deployment-checklist', title: 'Production Pre-Flight Checklist', description: 'Mandatory verification checklist prior to launching to production.' },
    ],
  },
  {
    category: 'Trust, Compliance & Governance',
    items: [
      { slug: 'trust-center', title: 'Enterprise Trust Center Overview', description: 'Factual security architecture, control frameworks, and evidence mapping.' },
      { slug: 'security-controls', title: 'Security Controls Catalog', description: '15-category normalized controls and implementation status models.' },
      { slug: 'evidence', title: 'Evidence Mapping & Integrity', description: 'Immutable evidence snapshots with SHA-256 canonical hashing.' },
      { slug: 'questionnaires', title: 'Security Questionnaires', description: 'Evidence-backed customer security review responses.' },
      { slug: 'access-reviews', title: 'Access & Credential Reviews', description: 'Periodic governance reviews for members, roles, and API tokens.' },
      { slug: 'ai-privacy', title: 'AI Privacy & Code Protection', description: 'Deterministic offline execution and zero-secret transmission.' },
      { slug: 'data-retention', title: 'Data Retention & Cleanup', description: 'Configurable resource lifecycles and verified deletion jobs.' },
      { slug: 'public-trust-center', title: 'Public Trust Center Mode', description: 'Customer-shareable trust portals with strict privacy isolation.' },
    ],
  },
];

export const DOC_PAGES = {
  'getting-started': {
    slug: 'getting-started',
    title: 'Quickstart Guide',
    description: 'Get started scanning repositories for exposed credentials across your workflow.',
    category: 'Getting Started',
    headings: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'web-scanner', title: '1. Web Scanner' },
      { id: 'cli-scanner', title: '2. Terminal CLI' },
      { id: 'pre-commit', title: '3. Pre-Commit Hook' },
      { id: 'ci-cd', title: '4. Continuous Integration' },
    ],
    content: `
## Introduction

SecretShield is a developer-first credential scanner designed to find leaked API keys, tokens, private keys, and database passwords before they reach production.

It requires **zero third-party AI APIs**, runs completely offline or locally in your browser, and masks all findings immediately in memory.

## 1. Web Scanner

To scan source code or a repository immediately without installing software:

1. Navigate to the **[Scanner](/scan)** page.
2. Select your input mode: **Paste Code**, **Upload Files / ZIP Archive**, or **Connect Repository**.
3. Click **Scan Code**. Findings appear in real-time with confidence scores, entropy analysis, and remediation guidance.

## 2. Terminal CLI

Install the official SecretShield CLI globally or invoke it via npx:

\`\`\`bash
# Install globally via npm
npm install -g @secretshield/cli

# Or run directly on any directory
secretshield scan ./src

# Scan with JSON or SARIF output
secretshield scan ./src --format=sarif --output=results.sarif
\`\`\`

## 3. Pre-Commit Hook

Install an automated Git pre-commit hook in your repository:

\`\`\`bash
cd /path/to/your/git/repo
secretshield install-hook
\`\`\`

Whenever you run \`git commit\`, SecretShield automatically inspects staged file diffs in sub-20ms. If a secret is detected, the commit is blocked with a clear warning.

## 4. Continuous Integration

Add SecretShield to your GitHub Actions or GitLab CI pipeline to verify every pull request and push. See our **[GitHub Actions Guide](/docs/github-actions)** for complete workflow recipes.
`,
  },

  'scanner': {
    slug: 'scanner',
    title: 'Scanner Engine & Intelligence Layer',
    description: 'Deterministic rule execution, Shannon entropy, language detection, and context filtering.',
    category: 'Getting Started',
    headings: [
      { id: 'pipeline', title: 'Scanning Pipeline' },
      { id: 'language-detection', title: 'Language Detection' },
      { id: 'entropy-engine', title: 'Shannon Entropy Engine' },
      { id: 'confidence-scoring', title: 'Confidence Scoring' },
      { id: 'in-memory-masking', title: 'In-Memory Masking' },
    ],
    content: `
## Scanning Pipeline

SecretShield uses a 9-stage deterministic detection pipeline to evaluate code without sending data to external APIs:

\`\`\`text
Raw File / Diff
  │
  ├── 1. Language Detection & File Type Filtering
  ├── 2. Provider Rule Matching (AWS, GitHub, Stripe, OpenAI, etc.)
  ├── 3. Generic Secret & JWT Parsers
  ├── 4. Shannon Entropy Engine Calculation
  ├── 5. Variable Context & Proximity Analysis
  ├── 6. False Positive Analysis (tests, mocks, docs)
  ├── 7. Confidence Scoring (0-100%)
  ├── 8. Baseline & Suppressions Check
  └── 9. In-Memory Masking & Fingerprint Generation
\`\`\`

## Language Detection

SecretShield automatically inspects file extensions and shebang lines to adapt rule boundaries. For example:
- In **JavaScript/TypeScript**, object key assignors (\`apiKey:\`, \`secretToken:\`) increase confidence.
- In **Python**, variable assignments (\`AWS_SECRET_KEY =\`) are evaluated.
- In **JSON / YAML**, config hierarchies and environment structures are parsed.

## Shannon Entropy Engine

High-entropy detection identifies cryptographically generated strings even when provider prefixes are omitted:

$$\\text{Entropy} = -\\sum_{i=1}^n P(c_i) \\log_2 P(c_i)$$

Strings with character set entropy $> 4.5$ and variable names matching sensitive contexts are flagged with high confidence.

## In-Memory Masking

Detected raw secrets are immediately converted into safe 8-character fingerprints:
- Prefix and suffix are retained (e.g., \`AKIA...MPLE\`).
- Raw values are scrubbed from memory buffers and are never persisted to database tables.
`,
  },

  'npm': {
    slug: 'npm',
    title: 'Standalone npm Package (@secretshield/scanner)',
    description: 'Embed the lightweight, zero-cloud secret scanning engine directly into Node.js applications, custom scripts, and build pipelines.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'installation', title: 'Installation' },
      { id: 'quickstart', title: 'Programmatic Scanning' },
      { id: 'scan-directory', title: 'Directory & File Scans' },
      { id: 'git-diff', title: 'Scanning Git Diffs' },
      { id: 'security-guarantees', title: 'Security & Privacy Guarantees' },
    ],
    content: `
## Installation

Install \`@secretshield/scanner\` as a dependency in your Node.js project:

\`\`\`bash
npm install @secretshield/scanner
# or using yarn
yarn add @secretshield/scanner
# or using pnpm
pnpm add @secretshield/scanner
\`\`\`

## Programmatic Scanning

Scan raw strings in-memory with sub-millisecond execution:

\`\`\`javascript
import { scanText } from '@secretshield/scanner';

const codeSnippet = \`
  const awsKey = "AKIAIOSFODNN7EXAMPLE";
\`;

const result = await scanText(codeSnippet, { filename: 'config.js' });

console.log(\`Status: \${result.status}\`);
console.log(\`Found \${result.findings.length} secret(s):\`);

for (const finding of result.findings) {
  console.log(\` - [\${finding.severity}] \${finding.ruleName}: \${finding.maskedValue} (Line \${finding.line})\`);
}
\`\`\`

## Directory & File Scans

Scan files and full directory trees recursively:

\`\`\`javascript
import { scanFile, scanDirectory } from '@secretshield/scanner';

// Scan single file
const fileResult = await scanFile('./src/auth/jwt.js');

// Scan entire directory with custom options
const dirResult = await scanDirectory('./src', {
  maxFileSize: 5 * 1024 * 1024, // 5MB limit
  customRules: [],
  allowlistFiles: ['sample.env.example']
});

console.log(\`Scanned \${dirResult.filesScanned} files in \${dirResult.duration}ms\`);
\`\`\`

## Scanning Git Diffs

Audit incoming code changes in CI pipelines or Git hook wrappers:

\`\`\`javascript
import { scanGitDiff } from '@secretshield/scanner';

const diffOutput = \`
+ const API_KEY = "sk_test_51AbcDefGhIjKlMnOpQrStUvWxYz0123456789";
\`;

const diffResult = await scanGitDiff(diffOutput);
if (diffResult.findings.length > 0) {
  console.error('SecretShield detected secrets in Git diff!');
}
\`\`\`

## Security & Privacy Guarantees

1. **Zero External AI Calls**: Runs purely locally with deterministic regex patterns, Shannon entropy calculation, and contextual false-positive suppression.
2. **Immediate Masking**: Raw secret strings never escape the detector boundary.
3. **No Native Binaries**: Pure JavaScript with JSDoc typing for frictionless cross-platform deployments.
`,
  },

  'vscode': {
    slug: 'vscode',
    title: 'VS Code Extension',
    description: 'Catch exposed credentials in real-time as you code with the official SecretShield VS Code extension.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'installation', title: 'Installation & Setup' },
      { id: 'features', title: 'Core Capabilities' },
      { id: 'commands', title: 'Commands & Shortcuts' },
      { id: 'configuration', title: 'Configuration Settings' },
    ],
    content: `
## Installation & Setup

Install the SecretShield extension from the Visual Studio Code Marketplace or load the extension from the \`extensions/vscode\` directory:

1. Open VS Code.
2. Navigate to Extensions (\`Ctrl+Shift+X\` or \`Cmd+Shift+X\`).
3. Search for **SecretShield** and click **Install**.
4. The extension activates automatically and begins real-time scanning on save.

## Core Capabilities

- ⚡ **Instant Real-Time Diagnostics**: Detects secrets as you work, surfacing inline red/yellow error squiggles with complete problem details.
- 📁 **Dedicated Activity Bar Explorer**: Review all open workspace findings grouped by file and severity in a clean tree hierarchy.
- 💡 **Rich Hover Tooltips**: Hover over flagged lines to inspect masked credential representations, Shannon entropy scores, and remediation guides.
- 🔒 **100% Offline & Private**: Zero code transmitted over the network or sent to external cloud AI services.

## Commands & Shortcuts

Access these commands via the VS Code Command Palette (\`Ctrl+Shift+P\` or \`Cmd+Shift+P\`):

- \`SecretShield: Scan Current File\` — Trigger an immediate on-demand scan of the active editor.
- \`SecretShield: Scan Entire Workspace\` — Recursively audit all project files.
- \`SecretShield: Focus Findings Sidebar\` — Jump directly to the findings tree view.
- \`SecretShield: Clear All Findings\` — Reset active diagnostics and clear findings cache.

## Configuration Settings

Customize behavior in your \`settings.json\` or workspace \`.secretshield.json\`:

\`\`\`json
{
  "secretshield.enabled": true,
  "secretshield.scanOnSave": true,
  "secretshield.severityThreshold": "LOW",
  "secretshield.configPath": ".secretshield.json",
  "secretshield.maxFileSize": 5242880
}
\`\`\`
`,
  },

  'cli': {
    slug: 'cli',
    title: 'CLI & Benchmark Tool',
    description: 'Standalone terminal tool for local scanning, automated hooks, and throughput benchmarks.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'installation', title: 'Installation' },
      { id: 'commands', title: 'CLI Commands' },
      { id: 'benchmarks', title: 'Scan Performance Benchmark' },
      { id: 'sarif-export', title: 'SARIF 2.1.0 Export' },
    ],
    content: `
## Installation

The SecretShield CLI is available in the \`packages/cli\` directory and can be linked or run locally:

\`\`\`bash
# Link locally during development
cd packages/cli
npm link

# Verify installation
secretshield --version
\`\`\`

## CLI Commands

### 1. Scan Directory or File
\`\`\`bash
# Scan a local folder
secretshield scan ./app

# Scan with high severity threshold only
secretshield scan . --min-confidence=80 --severity=CRITICAL

# Ignore specific paths
secretshield scan . --ignore="node_modules,dist,*.test.js"
\`\`\`

### 2. Git Staged Diff Scan
\`\`\`bash
# Scan only files currently staged in Git
secretshield scan --staged
\`\`\`

### 3. Install Pre-Commit Hook
\`\`\`bash
secretshield install-hook
\`\`\`

## Scan Performance Benchmark

Run high-throughput benchmarking on synthetic code generators to test scanner latency:

\`\`\`bash
secretshield benchmark --files=500 --size-kb=50
\`\`\`

Typical throughput exceeds **1,200+ files per second** on standard multi-core developer laptops.

## SARIF 2.1.0 Export

Export findings in OASIS Standard SARIF 2.1.0 format for seamless integration into security dashboards:

\`\`\`bash
secretshield scan . --format=sarif --output=secretshield.sarif
\`\`\`
`,
  },

  'pre-commit': {
    slug: 'pre-commit',
    title: 'Git Pre-Commit Hooks',
    description: 'Install fast local Git hooks to prevent committing secrets.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'overview', title: 'Overview' },
      { id: 'automatic-install', title: 'Automatic Installation' },
      { id: 'manual-install', title: 'Manual Hook Script' },
      { id: 'bypass-rule', title: 'Bypassing for False Positives' },
    ],
    content: `
## Overview

The SecretShield pre-commit hook executes locally before any commit is finalized. It scans only the files staged in git index (\`git diff --cached\`), ensuring instantaneous execution without slowing down developer workflow.

## Automatic Installation

Run the following command in any repository root:

\`\`\`bash
secretshield install-hook
\`\`\`

This creates \`.git/hooks/pre-commit\` and sets executable permissions.

## Manual Hook Script

If you prefer configuring the hook manually without the CLI tool, create \`.git/hooks/pre-commit\`:

\`\`\`bash
#!/usr/bin/env sh
# SecretShield Git Pre-Commit Hook

echo "🛡️  SecretShield: Scanning staged files for secrets..."
npx @secretshield/cli scan --staged --exit-zero-on-clean

if [ $? -ne 0 ]; then
  echo "❌ Commit rejected by SecretShield. Please remove credentials before committing."
  exit 1
fi
\`\`\`

## Bypassing for False Positives

If a finding is a known non-functional mock or synthetic test string, add it to your **\`.secretshield-baseline.json\`** file or temporarily bypass with:

\`\`\`bash
git commit --no-verify -m "commit message"
\`\`\`
`,
  },

  'github': {
    slug: 'github',
    title: 'GitHub App Integration',
    description: 'Connect GitHub organizations to scan Pull Requests and add inline review annotations.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'architecture', title: 'GitHub App Architecture' },
      { id: 'permissions', title: 'Required Permissions' },
      { id: 'webhook-events', title: 'Supported Webhook Events' },
      { id: 'pr-annotations', title: 'Pull Request Review Annotations' },
    ],
    content: `
## GitHub App Architecture

SecretShield integrates with GitHub through a dedicated GitHub App rather than personal access tokens. This provides:
- Organization-level granular repository access.
- Ephemeral installation access tokens that expire after 1 hour.
- Webhook signature verification using HMAC-SHA256 (\`X-Hub-Signature-256\`).

## Required Permissions

SecretShield adheres to the principle of least privilege:
- **Pull Requests**: Read & Write (to post inline review comments and status checks).
- **Checks**: Read & Write (to publish GitHub Check Runs).
- **Contents**: Read (to scan commit diffs and modified files).

## Supported Webhook Events

- \`pull_request.opened\`, \`pull_request.synchronize\`, \`pull_request.reopened\`
- \`push\` (for main branch monitoring)
- \`installation.created\`, \`installation.deleted\`

## Pull Request Review Annotations

When a secret is committed to a PR branch, SecretShield immediately creates a GitHub Check Run and posts an inline review annotation pinpointing the exact line:

\`\`\`text
⚠️ SecretShield Security Alert:
Detected AWS Access Key ID at src/config.js:42 (Confidence: 97%).
Raw credential has been masked. Please rotate this credential immediately.
\`\`\`
`,
  },

  'gitlab': {
    slug: 'gitlab',
    title: 'GitLab CI Integration',
    description: 'Integrate SecretShield with GitLab Merge Requests and pipeline webhooks.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'gitlab-webhooks', title: 'GitLab Webhooks' },
      { id: 'pipeline-config', title: '.gitlab-ci.yml Configuration' },
    ],
    content: `
## GitLab Webhooks

Configure GitLab webhooks pointing to your SecretShield instance at \`/api/webhooks/gitlab\` with the secret token configured in your workspace integrations.

## .gitlab-ci.yml Configuration

Add SecretShield to your \`.gitlab-ci.yml\` pipeline:

\`\`\`yaml
stages:
  - test
  - security

secretshield_scan:
  stage: security
  image: node:20-alpine
  script:
    - npx @secretshield/cli scan . --format=sarif --output=gl-secret-detection-report.sarif
  artifacts:
    reports:
      sast: gl-secret-detection-report.sarif
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
\`\`\`
`,
  },

  'github-actions': {
    slug: 'github-actions',
    title: 'GitHub Actions & SARIF',
    description: 'Automate security checks on every push and pull request with GitHub Security tab integration.',
    category: 'Developer & CI/CD Tooling',
    headings: [
      { id: 'workflow-yaml', title: 'Workflow YAML Configuration' },
      { id: 'sarif-upload', title: 'SARIF 2.1.0 Code Scanning Upload' },
    ],
    content: `
## Workflow YAML Configuration

Create \`.github/workflows/secretshield.yml\` in your repository:

\`\`\`yaml
name: SecretShield Scan

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  secretshield:
    name: SecretShield Credential Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run SecretShield Scanner
        run: |
          npx @secretshield/cli scan . --format=sarif --output=secretshield.sarif

      - name: Upload SARIF to GitHub Code Scanning
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: secretshield.sarif
\`\`\`
`,
  },

  'custom-rules': {
    slug: 'custom-rules',
    title: 'Custom Regex Rules & ReDoS Safety',
    description: 'Author custom detection rules and evaluate them safely with our ReDoS validator.',
    category: 'Rules & Remediation',
    headings: [
      { id: 'rule-format', title: 'Rule Definition Schema' },
      { id: 'redos-safety', title: 'ReDoS Safety Engine' },
      { id: 'rule-lab', title: 'Interactive Rule Lab' },
    ],
    content: `
## Rule Definition Schema

Custom rules allow organizations to detect proprietary internal tokens, service accounts, and API headers.

\`\`\`json
{
  "id": "custom-internal-api-key",
  "name": "Acme Corp Internal API Key",
  "description": "Internal microservice authentication token",
  "severity": "CRITICAL",
  "pattern": "acme_live_[0-9a-zA-Z]{32}",
  "confidence": 95,
  "entropyThreshold": 4.2
}
\`\`\`

## ReDoS Safety Engine

To prevent Regular Expression Denial of Service (ReDoS) attacks, SecretShield validates all regexes before saving or running them:
1. **Catastrophic Backtracking Analysis**: Detects nested quantifiers like \`(a+)+\` or \`(a|a)+\`.
2. **Evaluation Timeouts**: Custom regex executions are bound by strict 15ms execution timeouts per file chunk.
3. **Complexity Quotas**: Patterns exceeding recursion limits are rejected with actionable syntax advice.

## Interactive Rule Lab

Use the built-in **[Rule Lab](/rules/lab)** to paste candidate regexes and test them against sample test strings in real-time.
`,
  },

  'baseline': {
    slug: 'baseline',
    title: 'Baseline Suppressions',
    description: 'Manage historical findings and allowlists with .secretshield-baseline.json.',
    category: 'Rules & Remediation',
    headings: [
      { id: 'concept', title: 'Baseline Concept' },
      { id: 'file-format', title: 'Baseline File Format' },
      { id: 'generation', title: 'Generating Baselines' },
    ],
    content: `
## Baseline Concept

When introducing secret scanning to large legacy codebases, resolving hundreds of historical findings immediately can block engineering sprints.

The **Baseline** mechanism captures known historical findings in a committed file (\`.secretshield-baseline.json\`), allowing you to block **new** incoming secrets while scheduling remediation for historical items.

## Baseline File Format

\`\`\`json
{
  "version": "1.0.0",
  "generatedAt": "2026-09-20T00:00:00.000Z",
  "suppressions": [
    {
      "fingerprint": "fp_8a7d9f2e3c1b",
      "ruleId": "aws-access-key",
      "filePath": "legacy/old_sync.py",
      "reason": "Decommissioned test bucket, scheduled for deprecation"
    }
  ]
}
\`\`\`

## Generating Baselines

Generate a baseline file directly from your scan results:

\`\`\`bash
secretshield scan . --generate-baseline > .secretshield-baseline.json
\`\`\`
`,
  },

  'remediation': {
    slug: 'remediation',
    title: 'Remediation & Key Rotation',
    description: 'Standard operating procedures for triaging, rotating, and revoking exposed secrets.',
    category: 'Rules & Remediation',
    headings: [
      { id: 'step-1', title: 'Step 1: Invalidate & Rotate Immediately' },
      { id: 'step-2', title: 'Step 2: Inspect Cloud Audit Logs' },
      { id: 'step-3', title: 'Step 3: Remove from Git History' },
      { id: 'step-4', title: 'Step 4: Update Environment Variables' },
    ],
    content: `
## Step 1: Invalidate & Rotate Immediately

> [!IMPORTANT]
> Merely removing a key from source code is **NOT** sufficient. The credential must be revoked in the cloud provider console immediately.

1. **AWS**: Disable the IAM access key in the AWS IAM Console and generate a replacement key.
2. **GitHub**: Revoke the Personal Access Token or OAuth app secret via GitHub Settings.
3. **OpenAI / Stripe**: Invalidate the key in the developer dashboard.

## Step 2: Inspect Cloud Audit Logs

Review AWS CloudTrail, GitHub Audit Logs, or Stripe Logs for unauthorized access during the exposure window.

## Step 3: Remove from Git History

If the secret was committed to a repository, use \`git-filter-repo\` or BFG Repo-Cleaner to rewrite history:

\`\`\`bash
# Example with git-filter-repo
git filter-repo --replace-text <(echo "AKIAIOSFODNN7EXAMPLE==>REMOVED_SECRET")
git push origin --force --all
\`\`\`

## Step 4: Update Environment Variables

Store all production credentials in encrypted environment variable managers (e.g. AWS Secrets Manager, Doppler, Vault, or GitHub Repository Secrets).
`,
  },

  'api': {
    slug: 'api',
    title: 'REST API Reference',
    description: 'Programmatic API documentation for scan execution, findings queries, and health checks.',
    category: 'API & Reference',
    headings: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'health-endpoint', title: 'GET /api/health' },
      { id: 'scan-endpoint', title: 'POST /api/scan' },
      { id: 'findings-endpoint', title: 'GET /api/findings' },
    ],
    content: `
## Authentication

API requests are authenticated via Session Cookie or Bearer token header:

\`\`\`http
Authorization: Bearer <API_TOKEN>
\`\`\`

## GET /api/health

Unauthenticated health check probe returning application and scanner status.

\`\`\`json
{
  "status": "healthy",
  "version": "0.4.0",
  "scanner": "available",
  "database": "connected",
  "timestamp": "2026-09-20T00:00:00.000Z"
}
\`\`\`

## POST /api/scan

Execute an in-memory scan over provided file objects.

\`\`\`json
{
  "files": [
    { "name": "src/config.js", "content": "const KEY = '...';" }
  ],
  "options": {
    "minConfidence": 70
  }
}
\`\`\`
`,
  },

  'security': {
    slug: 'security',
    title: 'Security & Threat Matrix',
    description: 'Data isolation guarantees, in-memory processing, and responsible disclosure policy.',
    category: 'API & Reference',
    headings: [
      { id: 'threat-model', title: 'Threat Model & Security Design' },
      { id: 'zero-ai', title: 'Zero-AI & Data Isolation' },
      { id: 'disclosure', title: 'Responsible Disclosure Policy' },
    ],
    content: `
## Threat Model & Security Design

SecretShield is architected specifically to handle sensitive security data without creating risk:
- **Zip Slip Mitigation**: File paths inside archives are strictly validated to prevent directory traversal.
- **Zip Bomb Rejection**: Decompression size ratios (>100x) and max memory thresholds (200MB) reject archive bombs.
- **Symlink Protection**: Symbolic links targeting system files are rejected before extraction.

## Zero-AI & Data Isolation

All detection logic is deterministic and local. Source code is never sent to LLMs or third-party cloud processors.

## Responsible Disclosure Policy

If you discover a security vulnerability within SecretShield, please review our **[Responsible Disclosure Guidelines](/security)** or review the **\`SECURITY.md\`** file in our repository.
`,
  },

  'privacy': {
    slug: 'privacy',
    title: 'Privacy Architecture',
    description: 'Our core privacy principles, zero telemetry on code, and masked finding guarantees.',
    category: 'Getting Started',
    headings: [
      { id: 'principles', title: 'Core Privacy Principles' },
      { id: 'no-secret-storage', title: 'Zero Secret Storage' },
      { id: 'offline-capability', title: 'Full Offline Operation' },
    ],
    content: `
## Core Privacy Principles

1. **Your Code Stays Yours**: We do not send source code or file names to external servers.
2. **No AI APIs**: We use regex and deterministic heuristics rather than AI endpoints.
3. **Zero Secret Persistence**: Only masked fingerprints are saved to database tables.

## Full Offline Operation

The core scanner runs completely client-side in the browser or as an offline CLI utility without requiring network connectivity.
`,
  },

  'faq': {
    slug: 'faq',
    title: 'Technical FAQ',
    description: 'Common questions about performance, detection rules, CI/CD integration, and data privacy.',
    category: 'API & Reference',
    headings: [
      { id: 'performance', title: 'How fast is SecretShield?' },
      { id: 'comparison', title: 'How does this compare to GitGuardian or Trufflehog?' },
      { id: 'languages', title: 'Which programming languages are supported?' },
    ],
    content: `
## How fast is SecretShield?

The in-memory scanner engine processes over **1,200 files per second** on standard multi-core hardware. Single-file git pre-commit checks run in under **20 milliseconds**.

## How does this compare to GitGuardian or Trufflehog?

SecretShield provides a completely self-contained, browser + CLI + SaaS experience that does not require cloud vendor accounts or paid plans for core features. It runs locally, offline, and gives developers full control.

## Which programming languages are supported?

SecretShield scans all text and source files regardless of language, with specialized context analyzers for JavaScript, TypeScript, Python, Go, Java, Rust, Ruby, PHP, JSON, YAML, Shell, and Dockerfiles.
`,
  },

  'trust-center': {
    slug: 'trust-center',
    title: 'Enterprise Trust Center Overview',
    description: 'Understand SecretShield security architecture, control definitions, and evidence mapping.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'purpose', title: 'Purpose & Philosophy' },
      { id: 'factual-controls', title: 'Factual Controls vs Certifications' },
      { id: 'evidence-chain', title: 'Evidence-Backed Architecture' },
    ],
    content: `
## Purpose & Philosophy

The SecretShield Trust & Compliance Center allows organizations to document, evaluate, and export their technical security controls and evidence.

> [!IMPORTANT]
> Control mappings in SecretShield are informational technical baselines and do not constitute formal third-party certifications (e.g. SOC 2, ISO 27001, HIPAA, PCI DSS) unless independent certification evidence is formally linked.

## Factual Controls vs Certifications

SecretShield strictly separates:
1. **Documented Control**: A declared organizational rule or technical measure.
2. **Collected Evidence**: Immutable, cryptographically hashed system output confirming implementation.
3. **Organizational Assertion**: Internal operational declarations.
4. **External Certification**: Authoritative third-party audit reports.

## Evidence-Backed Architecture

Every control status is backed by live telemetry from the scanner engine, audit logs, CI check results, and access review records.
`,
  },

  'security-controls': {
    slug: 'security-controls',
    title: 'Security Controls Catalog',
    description: '15-category normalized control framework and implementation lifecycle.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'categories', title: '15 Control Categories' },
      { id: 'statuses', title: 'Implementation Statuses' },
      { id: 'review-cadence', title: 'Review Cadence' },
    ],
    content: `
## 15 Control Categories

The control framework spans all technical layers:
- Security Architecture
- Data Handling & Privacy
- Encryption in Transit & Rest (AES-256-GCM)
- Authentication & MFA
- Authorization & RBAC
- Audit Logging & Integrity
- Data Retention & Verified Deletion
- Vulnerability Management & Scanner Rules
- Incident Response & Playbooks
- Backup & Disaster Recovery
- Secure Software Development (SDLC)
- Secret Handling & Redaction
- Third-Party Vendor Integrations
- AI Privacy & Data Minimization
- Infrastructure & Deployment Isolation

## Implementation Statuses

Controls are tracked using 5 strict statuses:
- **IMPLEMENTED**: Active with valid, unexpired evidence.
- **PARTIALLY_IMPLEMENTED**: Partially active or pending full repository rollout.
- **PLANNED**: Scheduled on engineering roadmap.
- **NOT_IMPLEMENTED**: Currently inactive.
- **NOT_APPLICABLE**: Explicitly exempted with documented justification.

## Review Cadence

Controls require periodic administrative review (default 90 or 365 days). Overdue controls are flagged in the Trust Dashboard.
`,
  },

  'evidence': {
    slug: 'evidence',
    title: 'Evidence Mapping & Integrity',
    description: 'Tamper-evident snapshots, canonical hashing, and validity windows.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'integrity-hashing', title: 'SHA-256 Canonical Integrity Hashing' },
      { id: 'zero-secret-storage', title: 'Zero-Secret Guarantee' },
      { id: 'evidence-sources', title: 'Supported Evidence Sources' },
    ],
    content: `
## SHA-256 Canonical Integrity Hashing

When evidence is collected from database logs, scan runs, or access reviews, SecretShield computes a deterministic SHA-256 hash of the canonical JSON payload.

## Zero-Secret Guarantee

> [!IMPORTANT]
> Raw credentials, tokens, and authorization keys are strictly prohibited from entering evidence records. Only masked fingerprints (e.g. \`fp_a7f92bc3\`) and metadata are archived.

## Supported Evidence Sources

- **SECURITY_EVENT**: Continuous monitoring detections.
- **AUDIT_LOG**: Administrative and authorization changes.
- **CONFIGURATION**: System encryption and auth settings.
- **POLICY**: Approved organizational governance documents.
- **INCIDENT**: Triage and remediation verification records.
- **SCAN**: In-memory and CI pipeline scan runs.
- **ACCESS_REVIEW**: Periodic RBAC audit signatures.
`,
  },

  'questionnaires': {
    slug: 'questionnaires',
    title: 'Security Questionnaires',
    description: 'Evidence-backed customer security review responses across 12 categories.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'templates', title: '12 Standard Categories' },
      { id: 'answer-criteria', title: 'Evidence-Backed Answers' },
    ],
    content: `
## 12 Standard Categories

SecretShield provides pre-populated response templates across common vendor security categories:
- Access Control
- Authentication
- Encryption
- Data Protection
- Incident Response
- Logging & Monitoring
- Retention
- Backup & Recovery
- Secure Development
- Vulnerability Management
- Third-Party Integrations
- AI / Data Processing

## Evidence-Backed Answers

Answers are strictly qualified:
- **YES**: Control is fully active with attached evidence.
- **PARTIALLY**: Partial implementation in progress.
- **NO**: Control is not present.
- **NOT_APPLICABLE**: Not relevant to operational model.
`,
  },

  'access-reviews': {
    slug: 'access-reviews',
    title: 'Access & Credential Reviews',
    description: 'Governance workflows for periodic auditing of members, roles, repositories, and API credentials.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'targets', title: 'Review Targets' },
      { id: 'workflow-states', title: 'Workflow States' },
    ],
    content: `
## Review Targets

Administrators conduct periodic governance audits across:
- **Organization Members & Roles**: Verify Owner, Admin, and Contributor permissions.
- **Repository Access**: Confirm branch protections and collaborator access.
- **Integration Webhooks**: Audit active CI/CD connections and OAuth scopes.
- **API Credentials**: Track metadata-only credential inventories.

## Workflow States

- **PENDING**: Awaiting administrative review.
- **REVIEWED**: Access confirmed valid.
- **REVOKED**: Access explicitly disabled.
- **EXPIRED**: Exceeded review interval without sign-off.
`,
  },

  'ai-privacy': {
    slug: 'ai-privacy',
    title: 'AI Privacy & Code Protection',
    description: 'Deterministic offline execution, zero model training, and pre-transmission secret redaction.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'deterministic-scanning', title: 'Deterministic Offline Engine' },
      { id: 'redaction-protocol', title: 'Pre-Transmission Redaction' },
      { id: 'zero-training', title: 'Zero Model Training' },
    ],
    content: `
## Deterministic Offline Engine

SecretShield secret detection runs 100% locally in volatile memory using regex patterns, Shannon entropy analysis, and contextual heuristics. It requires zero cloud AI APIs.

## Pre-Transmission Redaction

When optional AI triage assistance is enabled, all source code strings are scrubbed of credentials and sensitive tokens before any API call is initiated.

## Zero Model Training

No customer source code or findings are ever used to train external artificial intelligence models.
`,
  },

  'data-retention': {
    slug: 'data-retention',
    title: 'Data Retention & Cleanup',
    description: 'Configurable resource lifecycles, point-in-time retention windows, and verified cleanup deletion.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'windows', title: 'Standard Retention Windows' },
      { id: 'verification', title: 'Verified Deletion Engine' },
    ],
    content: `
## Standard Retention Windows

- Scans & Diffs: 90 days
- Findings & Fingerprints: 365 days
- Control Evidence Snapshots: 365 days
- Audit Logs: 365 days
- Incident Records: 730 days
- AI Assistant History: 30 days

## Verified Deletion Engine

SecretShield verifies that database records have been expunged before updating retention logs. Deletion claims are backed by automated job verification hashes.
`,
  },

  'public-trust-center': {
    slug: 'public-trust-center',
    title: 'Public Trust Center Mode',
    description: 'Customer-shareable trust portals with strict privacy isolation.',
    category: 'Trust, Compliance & Governance',
    headings: [
      { id: 'publishing', title: 'Publishing Public Controls' },
      { id: 'leakage-prevention', title: 'Strict Leakage Prevention' },
    ],
    content: `
## Publishing Public Controls

Organizations can publish a public trust portal at \`/trust/public/[org-slug]\` to share security posture with prospects and auditors.

## Strict Leakage Prevention

Public Trust Center endpoints are isolated by design:
- Private findings and masked secrets are NEVER exposed.
- Internal repository names are hidden by default.
- Internal audit logs and member emails are excluded.
- Only explicitly whitelisted public controls are rendered.
`,
  },
};

