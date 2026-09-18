import { scan } from '../engine.js';

// Stripe test
const stripeKey = 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc';
console.log('=== Stripe sk_test_ ===');
console.log('Key:', stripeKey, '| Length:', stripeKey.length);
const r1 = scan({ files: [{ name: 'config.js', content: `const stripe = require('stripe')("${stripeKey}");` }] });
console.log('findings:', r1.findings.map(f => `${f.type}(${f.confidence})`));

// OpenAI
const openaiKey = 'sk-proj-' + 'Xq9mN3kR8pL2vH7yW4cB6jA1eG5fD0sQ9zT4nJ8';
console.log('\n=== OpenAI sk-proj- ===');
console.log('Key length after prefix:', openaiKey.length - 8);
const r2 = scan({ files: [{ name: 'config.js', content: `const k = "${openaiKey}";` }] });
console.log('findings:', r2.findings.map(f => `${f.type}(${f.confidence})`));

// Redis
console.log('\n=== Redis URL ===');
const r3 = scan({ files: [{ name: 'config.js', content: 'REDIS_URL="redis://:r3d1sP4ss@redis.example.com:6379"' }] });
console.log('findings:', r3.findings.map(f => `${f.type}(${f.confidence})`));

// OpenSSH
const opensshContent = [
  '-----BEGIN OPENSSH PRIVATE KEY-----',
  'b3BlbnNzaC1rZXktdjEAAAAFOpenSSHKeyContentHereNotReal123456789AB',
  '-----END OPENSSH PRIVATE KEY-----',
].join('\n');
console.log('\n=== OpenSSH ===');
const r4 = scan({ files: [{ name: 'id_ed25519', content: opensshContent }] });
console.log('findings:', r4.findings.map(f => `${f.type}(${f.confidence})`));
