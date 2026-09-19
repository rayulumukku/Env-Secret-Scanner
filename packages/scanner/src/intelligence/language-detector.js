/**
 * lib/scanner/intelligence/language-detector.js
 *
 * Language & file role detection for secret scanning.
 * Identifies 20+ programming languages, markup formats, and configuration roles.
 *
 * SECURITY:
 *   - Pure deterministic analysis using extensions, filenames, and shebang lines.
 *   - No external network calls, no AI APIs.
 */

/** Language mapping by file extension */
const EXTENSION_MAP = {
  // JavaScript / TypeScript
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue',
  svelte: 'svelte',

  // Backend / Systems
  py: 'python',
  pyw: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  rake: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',

  // Shell & Scripts
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ps1: 'powershell',
  bat: 'batch',
  cmd: 'batch',

  // Data & Config
  json: 'json',
  json5: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  xml: 'xml',
  sql: 'sql',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'css',
  less: 'css',

  // Infrastructure as Code
  tf: 'terraform',
  tfvars: 'terraform',
  hcl: 'hcl',
  proto: 'protobuf',
  graphql: 'graphql',
  gql: 'graphql',
};

/** Known filenames mapping directly to language/role */
const FILENAME_MAP = {
  dockerfile: 'dockerfile',
  containerfile: 'dockerfile',
  jenkinsfile: 'groovy',
  vagrantfile: 'ruby',
  gemfile: 'ruby',
  rakefile: 'ruby',
  makefile: 'makefile',
  gnumakefile: 'makefile',
  cmakelists: 'cmake',
  '.bashrc': 'shell',
  '.zshrc': 'shell',
  '.profile': 'shell',
};

/**
 * Detect language and configuration role for a given file.
 *
 * @param {string} filename - relative or absolute file path
 * @param {string} [content=''] - optional snippet for shebang / syntax cues
 * @returns {{
 *   language: string,
 *   isEnvFile: boolean,
 *   envRisk: 'HIGH' | 'TEMPLATE' | 'LOW' | 'NONE',
 *   isConfigFile: boolean,
 *   isIaC: boolean,
 *   isTestFile: boolean,
 *   isDocumentation: boolean
 * }}
 */
export function detectLanguage(filename = '', content = '') {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  const basename = normalized.split('/').pop() || '';
  const ext = basename.includes('.') ? basename.split('.').pop() : '';

  let language = 'unknown';

  // 1. Check exact basename matches
  if (FILENAME_MAP[basename]) {
    language = FILENAME_MAP[basename];
  } else if (basename.startsWith('dockerfile')) {
    language = 'dockerfile';
  } else if (basename.startsWith('.env')) {
    language = 'dotenv';
  } else if (ext && EXTENSION_MAP[ext]) {
    language = EXTENSION_MAP[ext];
  } else if (content && content.startsWith('#!')) {
    // Shebang fallback
    const firstLine = content.split('\n')[0].toLowerCase();
    if (firstLine.includes('python')) language = 'python';
    else if (firstLine.includes('node') || firstLine.includes('js')) language = 'javascript';
    else if (firstLine.includes('bash') || firstLine.includes('sh')) language = 'shell';
    else if (firstLine.includes('ruby')) language = 'ruby';
    else if (firstLine.includes('perl')) language = 'perl';
    else if (firstLine.includes('php')) language = 'php';
  }

  // 2. .env file classification
  const isEnvFile = basename.startsWith('.env') || basename.endsWith('.env');
  let envRisk = 'NONE';
  if (isEnvFile) {
    if (basename.includes('.example') || basename.includes('.template') || basename.includes('.sample') || basename.includes('.dist')) {
      envRisk = 'TEMPLATE';
    } else if (basename.includes('.production') || basename.includes('.prod') || basename === '.env' || basename === '.env.local') {
      envRisk = 'HIGH';
    } else if (basename.includes('.test') || basename.includes('.ci')) {
      envRisk = 'LOW';
    } else {
      envRisk = 'HIGH';
    }
  }

  // 3. Configuration File Identification
  const configNames = [
    'config.js', 'config.json', 'config.ts', 'config.yaml', 'config.yml',
    'settings.json', 'settings.yaml', 'settings.py',
    'application.yml', 'application.yaml', 'application.properties',
    'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml',
    'database.yml', 'database.json', 'db.config.js',
    'k8s.yaml', 'deployment.yaml', 'secret.yaml', 'values.yaml',
    'serverless.yml', 'wrangler.toml', 'netlify.toml', 'vercel.json',
  ];
  const isConfigFile = isEnvFile ||
    configNames.some(c => basename === c || basename.endsWith('.' + c)) ||
    normalized.includes('/.github/workflows/') ||
    normalized.includes('/config/') ||
    normalized.includes('/settings/');

  // 4. Infrastructure as Code (Terraform, Kubernetes, CloudFormation)
  const isIaC = language === 'terraform' ||
    language === 'hcl' ||
    basename.includes('compose.yml') ||
    basename.includes('docker-compose') ||
    language === 'dockerfile' ||
    (language === 'yaml' && (normalized.includes('k8s') || normalized.includes('helm') || normalized.includes('deploy')));

  // 5. Test file detection
  const isTestFile = /\.(test|spec)\.[jt]sx?$/i.test(basename) ||
    /_test\.(go|py|rb)$/i.test(basename) ||
    /^test_.*\.(py|rb)$/i.test(basename) ||
    normalized.includes('/tests/') ||
    normalized.includes('/test/') ||
    normalized.includes('/spec/') ||
    normalized.includes('/fixtures/') ||
    normalized.includes('/mocks/');

  // 6. Documentation detection
  const isDocumentation = /^readme(\.|$)/i.test(basename) ||
    /^changelog(\.|$)/i.test(basename) ||
    /^contributing(\.|$)/i.test(basename) ||
    normalized.includes('/docs/') ||
    normalized.includes('/doc/') ||
    ext === 'md' ||
    ext === 'mdx' ||
    ext === 'rst';

  return {
    language,
    isEnvFile,
    envRisk,
    isConfigFile,
    isIaC,
    isTestFile,
    isDocumentation,
  };
}
