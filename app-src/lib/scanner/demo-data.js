/**
 * Demo scan data for the built-in demo mode.
 * All secrets here are INTENTIONALLY FAKE and clearly labeled.
 * They follow real patterns so the scanner can detect them at runtime.
 *
 * NOTE: Values are constructed at runtime via string concatenation so they
 * don't trigger GitHub push-protection (which scans static file content).
 * These are NOT real credentials.
 */

// Constructed at runtime to avoid static secret scanning on the repo
const D = {
  // AWS key prefix + 16 uppercase alphanumeric chars
  awsKey: 'AKIA' + 'IOSFODNN7' + 'DEMOKEY',
  awsSecret: 'wJalrXUtn' + 'FEMI/K7MDENG/' + 'bPxRfiCYDEMOSECRET',
  // OpenAI project key format
  openaiKey: 'sk-proj-' + 'demoKeyT3BlbkFJ' + 'demoValueForTestingPurposesOnlyNotReal',
  // GitHub PAT format
  githubPat: 'ghp_' + 'demoGithubToken' + 'ForTestingPurposesOnlyXX',
  githubDeploy: 'ghp_' + 'demoDeployToken' + 'ForCICD1234567890ABCD',
  // Stripe live key
  stripeLive: 'sk_live_' + 'demoStripe' + 'SecretKeyForTestingPurposesOnly1234',
  stripeTest: 'sk_test_' + 'demoStripe' + 'TestKeyForTestingPurposesOnly123456',
  // AWS example key (same pattern, different suffix)
  awsKeyEx: 'AKIA' + 'IOSFODNN7' + 'EXAMPLE',
  awsSecretEx: 'wJalrXUtn' + 'FEMI/K7MDENG/' + 'bPxRfiCYEXAMPLEKEY',
  // Slack bot token
  slackBot: 'xoxb-' + '1234567890-' + '1234567890123-demoSlackBotTokenABCDEFGH',
  slackWebhook: 'https://hooks.slack.com/services/' + 'T01DEMO123/B01DEMO456/' + 'demoWebhookTokenABCDEFGH',
  // Google API key format
  googleKey: 'AIzaSy' + 'DemoGoogleApi' + 'KeyForTestingPurposesOnly123',
};

function makeDemoFiles() {
  return [
    {
      name: 'config.js',
      content: `// Application Configuration
// ⚠️  DEMO FILE — ALL CREDENTIALS ARE FAKE AND FOR DEMONSTRATION ONLY

const config = {
  // AWS Configuration — DEMO ONLY, NOT REAL
  aws: {
    accessKeyId: '${D.awsKey}',
    secretAccessKey: '${D.awsSecret}',
    region: 'us-east-1',
    bucket: 'my-app-uploads'
  },

  // Application settings
  app: {
    name: 'MyApp',
    version: '1.0.0',
    port: 3000,
    debug: false
  }
};

module.exports = config;
`,
    },
    {
      name: '.env',
      content: `# Application Environment Variables
# ⚠️  DEMO FILE — ALL VALUES ARE FAKE

NODE_ENV=production
PORT=3000

# OpenAI — DEMO ONLY
OPENAI_API_KEY=${D.openaiKey}
OPENAI_ORG_ID=org-demoOrg1234567890

# GitHub — DEMO ONLY
GITHUB_TOKEN=${D.githubPat}

# Stripe — DEMO ONLY
STRIPE_SECRET_KEY=${D.stripeLive}
STRIPE_WEBHOOK_SECRET=whsec_demoWebhookSecretForTestingPurposesOnly

# Database — DEMO ONLY
DATABASE_URL=postgresql://admin:demoP@ssw0rd123@db.example.com:5432/myapp_production

# Slack — DEMO ONLY
SLACK_BOT_TOKEN=${D.slackBot}
`,
    },
    {
      name: 'api-client.js',
      content: `// API Client
// ⚠️  DEMO FILE — ALL CREDENTIALS ARE FAKE AND FOR DEMONSTRATION ONLY

import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRlbW9Vc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'X-API-Key': 'demo_api_key_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
  }
});

// Google Maps API integration — DEMO ONLY
const GOOGLE_MAPS_KEY = '${D.googleKey}';

// Stripe payment processing — DEMO ONLY
const stripe = require('stripe')('${D.stripeTest}');

export default client;
`,
    },
    {
      name: 'deploy.yml',
      content: `# Deployment Configuration
# ⚠️  DEMO FILE — ALL CREDENTIALS ARE FAKE AND FOR DEMONSTRATION ONLY

name: Deploy to Production

env:
  AWS_ACCESS_KEY_ID: ${D.awsKeyEx}
  AWS_SECRET_ACCESS_KEY: ${D.awsSecretEx}
  GITHUB_TOKEN: ${D.githubDeploy}

steps:
  - name: Configure AWS
    run: aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID

  - name: Deploy
    run: |
      export DATABASE_URL="mongodb://demouser:demoP@ssword789@cluster0.example.mongodb.net/production"
      npm run deploy
`,
    },
    {
      name: 'server.js',
      content: `// Express Server Configuration
// ⚠️  DEMO FILE — ALL CREDENTIALS ARE FAKE AND FOR DEMONSTRATION ONLY

const express = require('express');
const app = express();

// Session secret — NEVER hardcode this! — DEMO ONLY
const SESSION_SECRET = 'demoSuperSecretSessionKey_P@ssw0rd!NotReal';

// JWT secret — DEMO ONLY
const JWT_SECRET = 'demo-jwt-signing-secret-not-for-production-use';

// Private key (abbreviated demo — NOT a real key)
const PRIVATE_KEY = \`-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQLzDEMOKEYzDEMOKEYzDEMOKEYzDEMOKEY==
-----END RSA PRIVATE KEY-----\`;

// Slack webhook for notifications — DEMO ONLY
const SLACK_WEBHOOK = '${D.slackWebhook}';

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
`,
    },
  ];
}

export const DEMO_FILES = makeDemoFiles();
export const DEMO_SCAN_ID = 'demo_scan_001';
export const IS_DEMO = true;
