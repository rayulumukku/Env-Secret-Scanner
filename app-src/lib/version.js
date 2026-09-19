/**
 * lib/version.js
 *
 * Safe application version metadata and semantic versioning disclosure.
 * Exported safely for display in footer, health checks, documentation, and CLI sync.
 */

export const SCANNER_VERSION = '2.1.0';
export const RULE_VERSION = '2026.09.1';
export const CONFIG_VERSION = '1.0.0';

export const VERSION_INFO = {
  version: '2.1.0',
  name: 'SecretShield',
  codename: 'Fortress',
  releaseDate: '2026-09-20',
  license: 'MIT',
  repoUrl: 'https://github.com/rayulumukku/Env-Secret-Scanner',
  docsUrl: '/docs',
  changelogUrl: '/docs/getting-started',
  scannerVersion: SCANNER_VERSION,
  ruleVersion: RULE_VERSION,
  configVersion: CONFIG_VERSION,
};

/**
 * Get safe application version string
 * @returns {string}
 */
export function getAppVersion() {
  return VERSION_INFO.version;
}

/**
 * Get sanitized public release metadata
 * @returns {object}
 */
export function getPublicVersionDetails() {
  return {
    version: VERSION_INFO.version,
    releaseDate: VERSION_INFO.releaseDate,
    codename: VERSION_INFO.codename,
    license: VERSION_INFO.license,
  };
}
