/**
 * lib/scanner/intelligence/context-engine.js
 *
 * Language-aware syntax and assignment context analyzer.
 * Extracts semantic indicators (variable names, assignment operators, enclosing structures)
 * tailored to JavaScript, Python, YAML, JSON, Shell, Dockerfile, SQL, and .env files.
 *
 * SECURITY:
 *   - Operates on syntax structure without logging or storing raw secret tokens.
 */

const SECRET_KEYWORDS = [
  'api_key', 'apikey', 'api-key', 'api_token', 'apitoken', 'access_token',
  'token', 'secret', 'password', 'passwd', 'pwd', 'auth_token',
  'authorization', 'bearer', 'credential', 'credentials',
  'private_key', 'privatekey', 'private-key', 'secret_key',
  'access_key', 'accesskey', 'access-key', 'client_secret', 'clientsecret',
  'database_url', 'db_url', 'db_password', 'db_pass', 'connection_string',
  'signing_key', 'signingkey', 'encrypt_key', 'encryption_key',
  'webhook_secret', 'webhook_token', 'refresh_token', 'refresh-token',
  'master_key', 'app_secret', 'jwt_secret', 'deploy_key',
];

/**
 * Extract variable name and assignment context based on programming language syntax.
 *
 * @param {string} line - matched line of code
 * @param {string} language - language detected from language-detector
 * @returns {{
 *   variableName: string,
 *   isSecretVariable: boolean,
 *   isAssignment: boolean,
 *   assignmentStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE',
 *   syntaxType: string
 * }}
 */
export function extractLanguageContext(line = '', language = 'unknown') {
  if (!line || typeof line !== 'string') {
    return {
      variableName: '',
      isSecretVariable: false,
      isAssignment: false,
      assignmentStrength: 'NONE',
      syntaxType: 'unknown',
    };
  }

  const trimmed = line.trim();
  let variableName = '';
  let syntaxType = language;
  let isAssignment = false;
  let assignmentStrength = 'NONE';

  // 1. .env format: KEY=VALUE or export KEY=VALUE
  if (language === 'dotenv' || /^(?:export\s+)?[A-Za-z0-9_.-]+\s*=\s*/i.test(trimmed)) {
    const envMatch = trimmed.match(/^(?:export\s+)?([A-Za-z0-9_.-]+)\s*=\s*(.*)$/i);
    if (envMatch) {
      variableName = envMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'dotenv';
    }
  }

  // 2. JavaScript / TypeScript: const/let/var KEY = '...' or KEY: '...'
  if (!variableName && (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx')) {
    const jsVarMatch = trimmed.match(/(?:const|let|var|export\s+const|export\s+let|export\s+var)?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]\s*/);
    if (jsVarMatch) {
      variableName = jsVarMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = trimmed.includes('=') ? 'STRONG' : 'MODERATE';
      syntaxType = 'javascript';
    }
  }

  // 3. Python: KEY = "..." or KEY: str = "..." or dict['key'] = "..."
  if (!variableName && language === 'python') {
    const pyMatch = trimmed.match(/(?:self\.)?([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*[A-Za-z0-9_.[\]]+)?\s*=\s*/);
    if (pyMatch) {
      variableName = pyMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'python';
    }
  }

  // 4. YAML / Kubernetes / Helm: key: "..." or - key: "..."
  if (!variableName && (language === 'yaml' || language === 'terraform' || language === 'hcl')) {
    const yamlMatch = trimmed.match(/^(?:-\s*)?([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (yamlMatch) {
      variableName = yamlMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'yaml';
    }
  }

  // 5. JSON: "key": "..."
  if (!variableName && language === 'json') {
    const jsonMatch = trimmed.match(/"([A-Za-z0-9_.-]+)"\s*:\s*/);
    if (jsonMatch) {
      variableName = jsonMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'MODERATE';
      syntaxType = 'json';
    }
  }

  // 6. Shell / Bash: export KEY="..." or KEY="..."
  if (!variableName && (language === 'shell' || language === 'powershell' || language === 'batch')) {
    const shMatch = trimmed.match(/(?:export|set|env:)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*/i);
    if (shMatch) {
      variableName = shMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'shell';
    }
  }

  // 7. Dockerfile: ENV KEY="..." or ARG KEY="..."
  if (!variableName && language === 'dockerfile') {
    const dockerMatch = trimmed.match(/^(?:ENV|ARG)\s+([A-Za-z_][A-Za-z0-9_]*)\s*[=\s]\s*(.*)$/i);
    if (dockerMatch) {
      variableName = dockerMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'dockerfile';
    }
  }

  // 8. SQL: IDENTIFIED BY '...' or PASSWORD '...'
  if (!variableName && language === 'sql') {
    if (/identified\s+by|password|set\s+password/i.test(trimmed)) {
      variableName = 'sql_password';
      isAssignment = true;
      assignmentStrength = 'STRONG';
      syntaxType = 'sql';
    }
  }

  // Generic fallback if not caught by specific language grammar
  if (!variableName) {
    const genericMatch = trimmed.match(/([A-Za-z0-9_.-]{2,50})\s*[:=]\s*/);
    if (genericMatch) {
      variableName = genericMatch[1].toLowerCase();
      isAssignment = true;
      assignmentStrength = 'MODERATE';
    }
  }

  // Check if variable name indicates a credential
  const isSecretVariable = SECRET_KEYWORDS.some(kw =>
    variableName.includes(kw) || variableName === kw || variableName.replace(/[^a-z0-9]/g, '_').includes(kw)
  );

  return {
    variableName,
    isSecretVariable,
    isAssignment,
    assignmentStrength,
    syntaxType,
  };
}

/**
 * Extract contextual signals from surrounding code.
 *
 * @param {object} opts
 * @param {string} opts.line - current line
 * @param {string} opts.surrounding - 3 lines before & after
 * @param {string} opts.language - language
 * @returns {Array<{ label: string, score: number, positive: boolean }>}
 */
export function analyzeContextSignals({ line = '', surrounding = '', language = 'unknown' }) {
  const signals = [];
  const langCtx = extractLanguageContext(line, language);
  const lowerLine = line.toLowerCase();
  const lowerSurrounding = surrounding.toLowerCase();

  if (langCtx.isSecretVariable) {
    signals.push({
      label: `Sensitive variable name (${langCtx.variableName}) in ${langCtx.syntaxType}`,
      score: 20,
      positive: true,
    });
  } else {
    // Check if secret keyword is in nearby lines
    const hasNearby = SECRET_KEYWORDS.some(kw => lowerSurrounding.includes(kw));
    if (hasNearby) {
      signals.push({
        label: 'Secret keyword in nearby code',
        score: 5,
        positive: true,
      });
    }
  }

  if (langCtx.assignmentStrength === 'STRONG') {
    signals.push({
      label: `Hardcoded assignment context (${langCtx.syntaxType})`,
      score: 10,
      positive: true,
    });
  }

  return signals;
}

export { SECRET_KEYWORDS };
