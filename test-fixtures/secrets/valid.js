/**
 * SYNTHETIC TEST FIXTURES — secrets/valid.js
 *
 * ALL values below are FAKE/NON-FUNCTIONAL.
 * They are constructed to match secret patterns for testing only.
 * NEVER use these values in any real system.
 *
 * Patterns constructed using string concatenation to avoid
 * triggering GitHub push protection on literal values.
 */

// AWS — Access Key ID format: AKIA + 16 uppercase alphanumeric
// SYNTHETIC ONLY — revoked/non-existent
export const AWS_ACCESS_KEY = 'AKIA' + 'IOSFODNN7EXAMPLE';   // fake test key
export const AWS_SECRET_KEY = 'wJalrXUtnFEMI' + '/K7MDENG/bPxRfiCYEXAMPLEKEY';  // AWS docs example

// GitHub — PAT format: ghp_ + 36 chars
export const GITHUB_PAT = 'ghp_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7';

// OpenAI — sk-proj- prefix
export const OPENAI_KEY = 'sk-proj-' + 'FakeTestKeyForScannerUnitTests12345678901234';

// Stripe — sk_test_ prefix
export const STRIPE_TEST_KEY = 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc';

// npm — npm_ prefix + 36 chars (exact)
export const NPM_TOKEN = 'npm_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R';

// JWT — synthesised eyJ header
// Header: {"alg":"HS256","typ":"JWT"} | Payload: {"sub":"test"} | sig: fake
export const JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciJ9' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Google API key — AIza + 35 chars
export const GOOGLE_API_KEY = 'AIza' + 'SyDFakeGoogleApiKeyForTestingPurp0ses';

// Slack bot token — xoxb- prefix + numbers-numbers-24 alphanumeric
export const SLACK_BOT_TOKEN = 'xoxb-' + '1234567890123-' + '1234567890123-' + 'A1B2C3D4E5F6G7H8I9J0K1L2';

// Slack webhook URL
export const SLACK_WEBHOOK = 'https://hooks.slack.com/services/T00000000/B00000000/FakeWebhookToken123456789';

// PostgreSQL connection string — fake DB
export const POSTGRES_URL = 'postgresql://testuser:s3cr3tPassw0rd@localhost:5432/testdb';

// MongoDB connection string
export const MONGO_URL = 'mongodb://testuser:s3cr3tPassw0rd@localhost:27017/testdb';

// Generic password
export const GENERIC_PASSWORD = 'mySuperS3cr3tPassw0rd!';

// Generic API key variable
export const GENERIC_API_KEY_VALUE = 'xKq9_Fake_API_Key_Value_For_Tests_01234';

// Private key block (fake — not a real key)
export const RSA_PRIVATE_KEY = [
  '-----BEGIN RSA PRIVATE KEY-----',
  'MIIEowIBAAKCAQEA2a2rwplBQLzHPZe5TNJP/8Q2iMkbJXMXBPiGiJoTbIqW',
  'FAKEKEYCONTENTNOTREALATALLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'FAKEKEYCONTENTNOTREALATALLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  '-----END RSA PRIVATE KEY-----',
].join('\n');

// Bearer token
export const BEARER_TOKEN = 'xKq9mFakeTestBearerToken123456789abcdef';

// High-entropy string (fake random-looking value)
export const HIGH_ENTROPY_VALUE = 'xK9Qm2PLnR7sTv4WyBg6HdEu8FjAc1Zo';
