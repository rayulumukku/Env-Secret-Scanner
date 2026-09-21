/**
 * packages/copilot/actions/index.js
 *
 * Deterministic Safe Quick-Fix Action Generator for SecretShield Copilot.
 *
 * SAFETY INVARIANTS:
 *   - Never stores or outputs raw secrets in action previews, diffs, or metadata.
 *   - Proposes only deterministic, safe transformations.
 *   - Always provides diff previews before execution.
 *   - Marks every action as advisory with user confirmation required.
 */

import path from 'node:path';
import { maskSecretValue, redactSecrets } from '../redaction/index.js';

/**
 * Derives a clean, uppercase environment variable name from a rule ID, variable name, or file.
 *
 * @param {string} [identifier] - Variable name or Rule ID (e.g. "OPENAI_API_KEY", "stripe_secret")
 * @param {string} [fallback] - Fallback name
 * @returns {string} Clean env var name (e.g. "OPENAI_API_KEY")
 */
export function deriveEnvVarName(identifier, fallback = 'SECRET_KEY') {
  if (!identifier || typeof identifier !== 'string') return fallback;

  // Clean identifier to uppercase SNAKE_CASE
  let name = identifier
    .replace(/^RULE_|^SECRETSHIELD_/i, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .toUpperCase()
    .replace(/^_|_$/g, '');

  if (!name) return fallback;
  if (!name.endsWith('_KEY') && !name.endsWith('_TOKEN') && !name.endsWith('_SECRET') && !name.endsWith('_URL')) {
    // Append descriptive suffix if short
    if (name.length < 8) name = `${name}_KEY`;
  }

  return name;
}

/**
 * Creates an action proposal to replace a hardcoded secret with an environment variable.
 *
 * @param {Object} finding
 * @param {string} fileContent
 * @returns {Object|null} Action proposal
 */
export function createEnvVarExtractionAction(finding, fileContent = '') {
  if (!finding) return null;
  const filePath = finding.filePath || finding.file || finding.path || 'index.js';

  const envVarName = deriveEnvVarName(finding.ruleId || 'SECRET_KEY');
  const ext = path.extname(filePath).toLowerCase();

  // Determine language replacement syntax
  let envAccessor = `process.env.${envVarName}`;
  let commentPrefix = '//';

  if (ext === '.py') {
    envAccessor = `os.environ.get("${envVarName}")`;
    commentPrefix = '#';
  } else if (ext === '.go') {
    envAccessor = `os.Getenv("${envVarName}")`;
    commentPrefix = '//';
  } else if (ext === '.rb') {
    envAccessor = `ENV["${envVarName}"]`;
    commentPrefix = '#';
  } else if (ext === '.php') {
    envAccessor = `getenv('${envVarName}')`;
    commentPrefix = '//';
  } else if (ext === '.rs') {
    envAccessor = `std::env::var("${envVarName}").unwrap_or_default()`;
    commentPrefix = '//';
  } else if (ext === '.java') {
    envAccessor = `System.getenv("${envVarName}")`;
    commentPrefix = '//';
  }

  const lineNum = finding.line || 1;
  const lines = fileContent ? fileContent.split(/\r?\n/) : [];
  const rawLine = lines[lineNum - 1] || '';

  // Generate safe diff preview without revealing secret
  let modifiedLine = rawLine;
  if (rawLine) {
    // Replace quotes around secret or literal assignment
    modifiedLine = rawLine.replace(/["'][^"'\r\n]{8,}["']/, envAccessor);
    if (modifiedLine === rawLine) {
      // Fallback replacement on target line
      modifiedLine = `${commentPrefix} Replaced hardcoded secret with environment variable\n${rawLine.replace(/=.+$/, `= ${envAccessor}`)}`;
    }
  } else {
    modifiedLine = `const ${envVarName} = ${envAccessor};`;
  }

  const safeOriginalLine = redactSecrets(rawLine);
  const safeModifiedLine = redactSecrets(modifiedLine);

  return {
    id: 'ACTION_EXTRACT_ENV_VAR',
    type: 'EXTRACT_ENV_VAR',
    title: `Extract to environment variable (${envAccessor})`,
    description: `Replace hardcoded secret in ${finding.filePath}:${lineNum} with ${envAccessor} and add ${envVarName} to environment configuration.`,
    targetFile: finding.filePath,
    envVarName,
    envAccessor,
    line: lineNum,
    previewDiff: [
      `--- ${finding.filePath}`,
      `+++ ${finding.filePath}`,
      `@@ -${lineNum},1 +${lineNum},1 @@`,
      `- ${safeOriginalLine || '[REDACTED_ORIGINAL_LINE]'}`,
      `+ ${safeModifiedLine}`
    ].join('\n'),
    suggestedEnvExampleEntry: `${envVarName}=your_${envVarName.toLowerCase()}_here`,
    safety: {
      isDestructive: false,
      requiresUserConfirmation: true,
      reversible: true
    }
  };
}

/**
 * Creates an action proposal to add a sensitive file or pattern to .gitignore.
 *
 * @param {Object} finding
 * @param {string} [gitignoreContent='']
 * @returns {Object} Action proposal
 */
export function createGitignoreAction(finding, gitignoreContent = '') {
  const filePath = finding.filePath || '.env';
  const fileName = path.basename(filePath);
  const targetPattern = filePath.includes('/') || filePath.includes('\\')
    ? filePath.replace(/\\/g, '/')
    : fileName;

  const alreadyIgnored = gitignoreContent.includes(targetPattern) || gitignoreContent.includes(fileName);

  return {
    id: 'ACTION_ADD_GITIGNORE',
    type: 'ADD_GITIGNORE',
    title: `Add ${fileName} to .gitignore`,
    description: `Ensure ${targetPattern} is never committed or tracked by Git version control.`,
    targetFile: '.gitignore',
    patternToAdd: targetPattern,
    alreadyPresent: alreadyIgnored,
    previewDiff: [
      `--- .gitignore`,
      `+++ .gitignore`,
      `@@ -end +end @@`,
      `+ # SecretShield: Ignore sensitive file`,
      `+ ${targetPattern}`
    ].join('\n'),
    safety: {
      isDestructive: false,
      requiresUserConfirmation: true,
      reversible: true
    }
  };
}

/**
 * Creates an action proposal to update or create .env.example with placeholders.
 *
 * @param {Object} finding
 * @param {string} [envExampleContent='']
 * @returns {Object} Action proposal
 */
export function createEnvExampleAction(finding, envExampleContent = '') {
  const envVarName = deriveEnvVarName(finding.ruleId || 'SECRET_KEY');
  const entry = `${envVarName}=your_${envVarName.toLowerCase()}_here`;
  const alreadyPresent = envExampleContent.includes(envVarName);

  return {
    id: 'ACTION_UPDATE_ENV_EXAMPLE',
    type: 'UPDATE_ENV_EXAMPLE',
    title: `Add ${envVarName} placeholder to .env.example`,
    description: `Add documentation entry for ${envVarName} with dummy sample placeholder in .env.example.`,
    targetFile: '.env.example',
    entryToAdd: entry,
    alreadyPresent,
    previewDiff: [
      `--- .env.example`,
      `+++ .env.example`,
      `@@ -end +end @@`,
      `+ # ${finding.ruleName || finding.ruleId || 'Secret Configuration'}`,
      `+ ${entry}`
    ].join('\n'),
    safety: {
      isDestructive: false,
      requiresUserConfirmation: true,
      reversible: true
    }
  };
}

/**
 * Creates an action proposal for inline suppression comment.
 *
 * @param {Object} finding
 * @param {string} [reason='Verified false positive / test sample']
 * @returns {Object} Action proposal
 */
export function createSuppressionAction(finding, reason = 'Verified false positive / test sample') {
  const filePath = finding.filePath || finding.file || finding.path || 'index.js';
  const ext = path.extname(filePath).toLowerCase();
  const ruleId = finding.ruleId || 'GENERIC_SECRET';
  const isHashComment = ext === '.py' || ext === '.sh' || ext === '.yaml' || ext === '.yml' || ext === '.rb';
  const commentStr = isHashComment
    ? `# secretshield-ignore ${ruleId} reason="${reason}"`
    : `// secretshield-ignore ${ruleId} reason="${reason}"`;

  const lineNum = finding.line || 1;

  return {
    id: 'ACTION_ADD_SUPPRESSION',
    type: 'ADD_SUPPRESSION',
    title: 'Suppress finding with inline comment',
    description: `Add SecretShield suppression annotation on line ${lineNum} with explicit justification.`,
    targetFile: filePath,
    line: lineNum,
    suppressionComment: commentStr,
    previewDiff: [
      `--- ${filePath}`,
      `+++ ${filePath}`,
      `@@ -${lineNum},0 +${lineNum},1 @@`,
      `+ ${commentStr}`
    ].join('\n'),
    safety: {
      isDestructive: false,
      requiresUserConfirmation: true,
      reversible: true
    }
  };
}

/**
 * Creates an action proposal for marking a finding as False Positive.
 *
 * @param {Object} finding
 * @param {string} [reason='Synthetic test fixture or sample token']
 * @returns {Object} Action proposal
 */
export function createFalsePositiveAction(finding, reason = 'Synthetic test fixture or sample token') {
  return {
    id: 'ACTION_MARK_FALSE_POSITIVE',
    type: 'MARK_FALSE_POSITIVE',
    title: 'Mark finding as False Positive',
    description: `Record evidence-backed false-positive status in SecretShield registry for fingerprint ${finding.fingerprint || finding.id}.`,
    findingId: finding.id || finding.fingerprint,
    reason,
    previewDiff: `Status update: [ACTIVE] -> [FALSE_POSITIVE]\nReason: ${reason}`,
    safety: {
      isDestructive: false,
      requiresUserConfirmation: true,
      reversible: true
    }
  };
}

/**
 * Generates all available safe quick-fix actions for a finding.
 *
 * @param {Object} finding
 * @param {Object} [context]
 * @param {string} [context.fileContent]
 * @param {string} [context.gitignoreContent]
 * @param {string} [context.envExampleContent]
 * @returns {Array<Object>} List of available safe actions
 */
export function generateQuickFixActions(finding, context = {}) {
  if (!finding) return [];

  const actions = [];
  const filePath = finding.filePath || finding.file || finding.path || 'index.js';

  // 1. Env variable extraction
  const envAction = createEnvVarExtractionAction(finding, context.fileContent);
  if (envAction) actions.push(envAction);

  // 2. Add to .env.example
  actions.push(createEnvExampleAction(finding, context.envExampleContent));

  // 3. Add to .gitignore if it's an env or config file
  const isEnvFile = /^\.env|config|credentials|secret/i.test(path.basename(filePath));
  if (isEnvFile) {
    actions.push(createGitignoreAction(finding, context.gitignoreContent));
  }

  // 4. Inline suppression
  actions.push(createSuppressionAction(finding));

  // 5. Mark False Positive
  actions.push(createFalsePositiveAction(finding));

  return actions;
}
