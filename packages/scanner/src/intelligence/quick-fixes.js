/**
 * lib/scanner/intelligence/quick-fixes.js
 *
 * Developer Quick Fix Code Generator.
 * Generates copyable, language-specific migration templates to move hardcoded secrets
 * into safe environment variable lookups.
 *
 * SECURITY INVARIANT:
 *   - NEVER inserts raw credentials or actual detected secret strings into generated code.
 *   - Uses ONLY sanitized placeholder variable names and standard system env lookups.
 */

/**
 * Generate a safe environment variable name from a finding's rule and context.
 *
 * @param {object} finding
 * @returns {string} e.g. "AWS_ACCESS_KEY_ID" or "DATABASE_URL" or "APP_SECRET_KEY"
 */
function deriveEnvVarName(finding = {}) {
  if (finding.variableName && /^[a-zA-Z0-9_]+$/.test(finding.variableName)) {
    return finding.variableName.toUpperCase();
  }
  const type = (finding.type || finding.ruleId || 'SECRET_KEY').toUpperCase();
  return type.replace(/[^A-Z0-9_]/g, '_').slice(0, 30);
}

/**
 * Generate developer quick fix suggestions for a given finding and programming language.
 *
 * @param {object} finding - finding object
 * @param {string} [language='javascript'] - detected language
 * @returns {{
 *   suggestedEnvVar: string,
 *   beforeSnippet: string,
 *   afterSnippet: string,
 *   explanation: string,
 *   envExampleEntry: string
 * }}
 */
export function generateQuickFix(finding = {}, language = 'javascript') {
  const envVar = deriveEnvVarName(finding);
  const maskedVal = finding.maskedValue || '••••••••';

  let beforeSnippet = `const ${envVar} = "${maskedVal}";`;
  let afterSnippet = `const ${envVar} = process.env.${envVar};`;
  let explanation = `Extract this hardcoded secret into the environment variable ${envVar}.`;

  const lang = (language || 'javascript').toLowerCase();

  if (lang === 'python') {
    beforeSnippet = `${envVar} = "${maskedVal}"`;
    afterSnippet = `import os\n${envVar} = os.environ["${envVar}"]`;
    explanation = `Use Python's os.environ dictionary to load ${envVar} at runtime.`;
  } else if (lang === 'yaml' || lang === 'dockerfile' || lang === 'terraform') {
    beforeSnippet = `${envVar}: "${maskedVal}"`;
    afterSnippet = `${envVar}: "\${${envVar}}"`;
    explanation = `Reference the ${envVar} variable from your container/host environment.`;
  } else if (lang === 'shell' || lang === 'bash') {
    beforeSnippet = `export ${envVar}="${maskedVal}"`;
    afterSnippet = `export ${envVar}="\${${envVar}}"`;
    explanation = `Pass ${envVar} via the shell environment instead of hardcoding.`;
  } else if (lang === 'go') {
    beforeSnippet = `${envVar} := "${maskedVal}"`;
    afterSnippet = `${envVar} := os.Getenv("${envVar}")`;
    explanation = `Load ${envVar} using Go's os.Getenv standard library package.`;
  } else if (lang === 'java') {
    beforeSnippet = `String ${envVar.toLowerCase()} = "${maskedVal}";`;
    afterSnippet = `String ${envVar.toLowerCase()} = System.getenv("${envVar}");`;
    explanation = `Fetch ${envVar} using Java's System.getenv() method.`;
  } else if (lang === 'php') {
    beforeSnippet = `$${envVar.toLowerCase()} = "${maskedVal}";`;
    afterSnippet = `$${envVar.toLowerCase()} = getenv('${envVar}');`;
    explanation = `Read ${envVar} via PHP's getenv() function.`;
  } else if (lang === 'dotenv') {
    beforeSnippet = `${envVar}=${maskedVal}`;
    afterSnippet = `${envVar}=your_${envVar.toLowerCase()}_here`;
    explanation = `Replace the real credential with a placeholder in .env.example.`;
  }

  return {
    suggestedEnvVar: envVar,
    beforeSnippet,
    afterSnippet,
    explanation,
    envExampleEntry: `${envVar}=your_${envVar.toLowerCase()}_here`,
  };
}
