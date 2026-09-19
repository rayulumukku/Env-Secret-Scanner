/**
 * lib/version.js
 *
 * Safe application version metadata and semantic versioning disclosure.
 * Exported safely for display in footer, health checks, documentation, and CLI sync.
 */

export const VERSION_INFO = {
  version: '0.4.0',
  name: 'SecretShield',
  codename: 'Fortress',
  releaseDate: '2026-09-20',
  license: 'MIT',
  repoUrl: 'https://github.com/rayulumukku/Env-Secret-Scanner',
  docsUrl: '/docs',
  changelogUrl: '/docs/getting-started',
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
