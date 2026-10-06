/**
 * lib/cloud/ssrf.js
 *
 * SSRF Guard & Cloud Endpoint Validator for SecretShield.
 *
 * DEFENSIVE INVARIANTS:
 * - Strictly allow only approved provider endpoints / domains (e.g., AWS, GCP, Azure official endpoints).
 * - Immediately reject loopback (127.0.0.1, localhost, ::1).
 * - Immediately reject private RFC-1918 IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
 * - Block link-local addresses, especially cloud metadata endpoints (169.254.169.254, metadata.google.internal).
 * - Block dangerous protocols (file://, gopher://, ftp://). Only https:// permitted for production cloud calls.
 */

const APPROVED_PROVIDER_DOMAINS = [
  // AWS
  /\.amazonaws\.com$/i,
  /\.aws\.amazon\.com$/i,
  // GCP
  /\.googleapis\.com$/i,
  /\.cloud\.google\.com$/i,
  // Azure
  /\.azure\.com$/i,
  /\.microsoft\.com$/i,
  /\.windows\.net$/i,
];

// Blocked hostnames & IPs
const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '169.254.169.254', // AWS/GCP/Azure link-local metadata IP
  'metadata.google.internal',
  '169.254.169.253',
  'fd00:ec2::254',
  '0.0.0.0',
]);

/**
 * Validates a cloud API endpoint URL against SSRF rules.
 * Throws an error if the URL is dangerous or points to an unauthorized destination.
 *
 * @param {string} endpointUrl
 * @param {object} [options={}]
 * @param {boolean} [options.allowCustomLocalMock=false] - Only enabled in strict unit test suites with synthetic mocks
 * @returns {string} Sanitized valid URL
 */
export function validateCloudEndpoint(endpointUrl, options = {}) {
  if (!endpointUrl || typeof endpointUrl !== 'string') {
    throw new Error('Cloud endpoint URL must be a non-empty string');
  }

  let parsed;
  try {
    parsed = new URL(endpointUrl);
  } catch {
    throw new Error(`SSRF Guard: Malformed URL '${endpointUrl}'`);
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  // Test suite mock exception if explicitly flagged
  if (options.allowCustomLocalMock && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'mock-cloud.internal')) {
    return parsed.toString();
  }

  // 1. Enforce HTTPS only
  if (protocol !== 'https:') {
    throw new Error(`SSRF Guard: Insecure protocol '${protocol}'. Only HTTPS cloud endpoints are permitted.`);
  }

  // 2. Reject known dangerous hostnames / metadata endpoints
  if (FORBIDDEN_HOSTNAMES.has(hostname)) {
    throw new Error(`SSRF Guard: Forbidden target host '${hostname}' detected.`);
  }

  // 3. Block private IPv4 ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(hostname)) {
    throw new Error(`SSRF Guard: Private or link-local IP range '${hostname}' is prohibited.`);
  }

  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    throw new Error(`SSRF Guard: Private IP range '${hostname}' is prohibited.`);
  }

  // 4. Must match approved provider domain patterns
  const isApproved = APPROVED_PROVIDER_DOMAINS.some(pattern => pattern.test(hostname));
  if (!isApproved) {
    throw new Error(`SSRF Guard: Hostname '${hostname}' is not an authorized cloud provider endpoint domain.`);
  }

  return parsed.toString();
}
