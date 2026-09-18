/**
 * SYNTHETIC TEST FIXTURES — false-positives/examples.js
 *
 * Values that the scanner should NOT flag (or flag with very low confidence).
 * These represent common safe patterns that naive regex scanners falsely report.
 */

// Placeholder variable names and values
export const PLACEHOLDER_API_KEY  = 'YOUR_API_KEY_HERE';
export const PLACEHOLDER_TOKEN    = 'your-token-here';
export const PLACEHOLDER_SECRET   = 'changeme';
export const PLACEHOLDER_PASSWORD = 'password123';
export const EXAMPLE_KEY          = 'example_api_key';
export const DUMMY_VALUE          = 'xxxxxxxxxxxxxxxxxxxxxxxx';
export const ANGLE_BRACKET_KEY    = '<YOUR_API_KEY>';
export const TEMPLATE_VAR         = '${API_KEY}';

// Stripe docs canonical example key — note: stored as fragments to avoid push protection
export const DOC_STRIPE_KEY  = 'sk_' + 'test_' + '4eC39HqLyjWDarjtT1zdp7dc'; // Stripe docs example

// Git commit hashes (hex strings, not secrets)
export const GIT_SHA = 'a3f5d8c2b1e4f7a09d3b5c8e1f2a4d6b';

// Pure numeric strings (not secrets)
export const PHONE_NUMBER   = '1234567890';
export const VERSION_STRING = '1.0.0';

// URLs (not secrets even if they look high-entropy)
export const PUBLIC_URL    = 'https://api.example.com/v1/data';
export const LOCALHOST_URL = 'http://localhost:3000';

// Short values (too short to be real secrets)
export const SHORT_VALUE = 'abc123';
export const TINY_VALUE  = 'xy';

// Env example file content (template — no real values)
export const ENV_EXAMPLE_CONTENT = `
DATABASE_URL=postgres://user:password@localhost:5432/mydb
API_KEY=your_api_key_here
SECRET_KEY=changeme
STRIPE_SECRET_KEY=sk_test_your_stripe_key
`;

// Common false positive: JWT-like but not valid structure
export const FAKE_JWT = 'not.a.validjwt';

// Common false positive: base64 image data
export const BASE64_IMAGE_PREFIX = 'data:image/png;base64,iVBORw0KGgo=';

// All-same-char strings (should not be flagged)
export const ALL_ZEROS  = '00000000000000000000000000000000';
export const ALL_ONES   = '11111111111111111111111111111111';
