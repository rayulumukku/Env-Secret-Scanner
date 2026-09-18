import Link from 'next/link';
import {
  BookOpen, Terminal, Shield, Code2, Key, Database,
  Cloud, GitBranch, Zap, ChevronRight, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Documentation — SecretShield',
  description: 'Learn how to use SecretShield to scan source code for exposed secrets, API keys, and credentials.',
};

const SECTIONS = [
  {
    id: 'quickstart',
    icon: Zap,
    title: 'Quick Start',
    content: [
      {
        type: 'text',
        text: 'SecretShield scans source code for accidentally exposed API keys, tokens, passwords, and other secrets. Get started in seconds — no signup required.',
      },
      {
        type: 'steps',
        steps: [
          { step: '1', text: 'Navigate to the Scanner page' },
          { step: '2', text: 'Paste code, upload files, or click "Load Demo" to try with fake credentials' },
          { step: '3', text: 'Click "Scan Code" and review findings in the Results dashboard' },
        ],
      },
    ],
  },
  {
    id: 'detection',
    icon: Shield,
    title: 'Detection Engine',
    content: [
      {
        type: 'text',
        text: 'The scanner uses a modular rule engine with 10+ built-in rule modules. Each rule uses regex patterns, entropy analysis, and confidence scoring.',
      },
      {
        type: 'table',
        headers: ['Rule', 'Detects', 'Severity'],
        rows: [
          ['AWS', 'Access Key IDs, Secret Keys, Session Tokens', 'CRITICAL'],
          ['GitHub', 'PATs, OAuth tokens, App tokens', 'CRITICAL'],
          ['OpenAI', 'Project keys, legacy sk- keys', 'CRITICAL'],
          ['Stripe', 'Live & test secret keys', 'CRITICAL / HIGH'],
          ['Google', 'API keys, OAuth secrets, service accounts', 'HIGH'],
          ['Slack', 'Bot tokens, webhook URLs', 'HIGH'],
          ['JWT', 'Hardcoded JSON Web Tokens', 'MEDIUM / HIGH'],
          ['Private Keys', 'RSA, EC, OpenSSH, PGP, PKCS#8', 'CRITICAL'],
          ['Database', 'Connection strings with passwords', 'CRITICAL'],
          ['Generic', 'Passwords, API keys, high-entropy strings', 'MEDIUM / HIGH'],
        ],
      },
    ],
  },
  {
    id: 'entropy',
    icon: Code2,
    title: 'Entropy Detection',
    content: [
      {
        type: 'text',
        text: 'Shannon entropy measures the randomness of a string. High-entropy strings in assignment contexts (e.g. const KEY = "...") are flagged as potential secrets even without a known prefix.',
      },
      {
        type: 'code',
        code: '// Entropy threshold: 4.5 (default)\n// Strings below this threshold are unlikely to be secrets\n\nconst SAFE = "hello_world";          // entropy: 2.9 — ignored\nconst SECRET = "xK9#mP2$nL5@qR8";   // entropy: 5.1 — flagged',
      },
    ],
  },
  {
    id: 'masking',
    icon: Key,
    title: 'Secret Masking',
    content: [
      {
        type: 'text',
        text: 'Detected secrets are NEVER shown in full. The masking engine reveals only a short prefix and suffix, replacing the rest with bullet characters (•).',
      },
      {
        type: 'code',
        code: '// Raw secret (never shown)\n"sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890"\n\n// What you see in SecretShield\n"sk-proj-••••••••1234"',
      },
    ],
  },
  {
    id: 'custom-rules',
    icon: Code2,
    title: 'Custom Rules',
    content: [
      {
        type: 'text',
        text: 'Create your own detection rules for internal tokens and organization-specific patterns on the Rules page.',
      },
      {
        type: 'code',
        code: '// Example custom rule\nName:     "Internal API Token"\nPattern:  MYAPP_[A-Z0-9]{32}\nSeverity: CRITICAL\nCategory: Internal',
      },
      {
        type: 'text',
        text: 'Regex patterns are validated before saving. Custom rules are applied in addition to all built-in rules.',
      },
    ],
  },
  {
    id: 'api',
    icon: Terminal,
    title: 'API Reference',
    content: [
      {
        type: 'text',
        text: 'SecretShield exposes a JSON API for programmatic scanning.',
      },
      {
        type: 'code',
        code: `POST /api/scan
Content-Type: application/json

{
  "files": [
    { "name": "config.js", "content": "const KEY = \\"...\\";"}
  ],
  "customRules": [],
  "allowlistFingerprints": [],
  "allowlistFiles": []
}`,
      },
      {
        type: 'code',
        code: `// Response (masked values only — never raw secrets)
{
  "id": "scan_abc12345",
  "timestamp": "2025-01-01T00:00:00Z",
  "stats": {
    "filesScanned": 1,
    "totalFindings": 2,
    "critical": 1,
    "high": 1,
    "medium": 0,
    "low": 0,
    "duration": 47
  },
  "findings": [
    {
      "type": "AWS_ACCESS_KEY_ID",
      "name": "AWS Access Key ID",
      "severity": "CRITICAL",
      "confidence": 98,
      "file": "config.js",
      "line": 3,
      "maskedValue": "AKIAIOSFODNN7••••••••3KEY",
      "fingerprint": "aws_access_a1b2c3d4",
      "description": "...",
      "remediation": "..."
    }
  ]
}`,
      },
      {
        type: 'text',
        text: 'Limits: 500KB per file, 5MB total. Allowed file types: JS, TS, Python, Ruby, PHP, Go, YAML, JSON, .env, and more.',
      },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security Architecture',
    content: [
      {
        type: 'text',
        text: 'SecretShield is built with a security-first approach. Here\'s what we guarantee:',
      },
      {
        type: 'list',
        items: [
          'Raw secret values are never logged to the server console',
          'Only masked values and fingerprints are returned from the API',
          'localStorage stores only fingerprints and masked values — never raw secrets',
          'Uploaded filenames are sanitized to prevent path traversal',
          'File size is limited (500KB per file, 5MB total)',
          'File types are validated against an allowlist',
          'Custom regex patterns have a 5-second execution timeout to prevent ReDoS',
          'No secrets are included in error messages',
          'No third-party AI APIs are used',
        ],
      },
    ],
  },
  {
    id: 'faq',
    icon: BookOpen,
    title: 'FAQ',
    content: [
      {
        type: 'qa',
        items: [
          {
            q: 'Does SecretShield send my code anywhere?',
            a: 'No. Scanning runs on your own Next.js server (or Vercel deployment). Your code is not sent to any third-party service.',
          },
          {
            q: 'Can I use this in CI/CD?',
            a: 'The scanner engine is designed to become a standalone npm package. CLI and GitHub Actions integration are coming soon.',
          },
          {
            q: 'Why are secrets masked in results?',
            a: 'To prevent accidental exposure. Even in a security dashboard, showing raw secrets creates risk. Masked values give you enough context to identify the finding without re-exposing the credential.',
          },
          {
            q: 'What file types are supported?',
            a: 'JS, TS, JSX, TSX, Python, Ruby, PHP, Java, Go, Rust, C#, C, C++, YAML, JSON, TOML, INI, .env, shell scripts, Terraform, SQL, and more.',
          },
          {
            q: 'How do I reduce false positives?',
            a: 'Mark findings as "False Positive" to add them to your allowlist. You can also increase the entropy threshold in Settings.',
          },
        ],
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2.5 mb-10">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Documentation</h1>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar nav */}
          <nav className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50"
                >
                  <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="space-y-12">
            {SECTIONS.map(section => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>

                <div className="space-y-4">
                  {section.content.map((block, i) => {
                    if (block.type === 'text') {
                      return <p key={i} className="text-muted-foreground leading-relaxed">{block.text}</p>;
                    }

                    if (block.type === 'code') {
                      return (
                        <div key={i} className="rounded-lg overflow-hidden border border-border/50">
                          <div className="bg-secondary/50 px-4 py-2 border-b border-border/30">
                            <span className="text-xs font-mono text-muted-foreground">code</span>
                          </div>
                          <pre className="bg-[oklch(0.08_0.004_240)] p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">
                            {block.code}
                          </pre>
                        </div>
                      );
                    }

                    if (block.type === 'table') {
                      return (
                        <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-secondary/50">
                              <tr>
                                {block.headers.map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {block.rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-secondary/20">
                                  {row.map((cell, ci) => (
                                    <td key={ci} className={`px-4 py-2.5 text-sm ${ci === 0 ? 'font-semibold text-foreground' : ci === 2 ? 'font-mono text-xs' : 'text-muted-foreground'}`}>
                                      {ci === 2 ? (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          cell.includes('CRITICAL') ? 'bg-red-950/50 text-red-400' :
                                          cell.includes('HIGH') ? 'bg-orange-950/50 text-orange-400' :
                                          'bg-yellow-950/50 text-yellow-400'
                                        }`}>{cell}</span>
                                      ) : cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    if (block.type === 'list') {
                      return (
                        <ul key={i} className="space-y-2">
                          {block.items.map((item, li) => (
                            <li key={li} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (block.type === 'steps') {
                      return (
                        <div key={i} className="space-y-2">
                          {block.steps.map((s, si) => (
                            <div key={si} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {s.step}
                              </span>
                              <p className="text-sm text-muted-foreground pt-0.5">{s.text}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (block.type === 'qa') {
                      return (
                        <div key={i} className="space-y-4">
                          {block.items.map((qa, qi) => (
                            <div key={qi} className="rounded-lg border border-border/40 bg-card/30 p-4">
                              <p className="font-semibold text-sm mb-1.5">{qa.q}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{qa.a}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
