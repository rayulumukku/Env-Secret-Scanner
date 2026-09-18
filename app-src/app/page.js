import Link from 'next/link';
import {
  Shield, Zap, Lock, Eye, Code2, Terminal, ArrowRight,
  CheckCircle, AlertTriangle, Github, Key, Database,
  Cloud, CreditCard, Bot, FileKey, Globe, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'SecretShield — Find Secrets Before They Find Your Production',
  description: 'Free developer security tool that scans source code for exposed API keys, tokens, passwords, and database credentials before they reach production.',
};

const DETECTION_CATEGORIES = [
  { icon: Cloud, label: 'AWS Credentials', desc: 'Access keys, secret keys, session tokens', color: 'text-orange-400' },
  { icon: Github, label: 'GitHub Tokens', desc: 'PATs, OAuth tokens, App tokens', color: 'text-purple-400' },
  { icon: Bot, label: 'OpenAI Keys', desc: 'Project keys, legacy sk- keys', color: 'text-green-400' },
  { icon: CreditCard, label: 'Stripe Keys', desc: 'Live & test secret keys', color: 'text-blue-400' },
  { icon: Globe, label: 'Google APIs', desc: 'API keys, OAuth secrets, service accounts', color: 'text-red-400' },
  { icon: GitBranch, label: 'Slack Tokens', desc: 'Bot tokens, webhook URLs', color: 'text-yellow-400' },
  { icon: FileKey, label: 'Private Keys', desc: 'RSA, EC, OpenSSH, PGP', color: 'text-pink-400' },
  { icon: Database, label: 'Database Credentials', desc: 'Connection strings, passwords', color: 'text-cyan-400' },
  { icon: Key, label: 'Generic Secrets', desc: 'API keys, bearer tokens, JWTs', color: 'text-indigo-400' },
  { icon: Code2, label: 'High Entropy Strings', desc: 'Entropy-based detection', color: 'text-teal-400' },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'All scanning runs locally in your browser or on your own server. Your code never touches our systems.',
  },
  {
    icon: Zap,
    title: '10+ Detection Rules',
    desc: 'Modular rule engine covering AWS, GitHub, OpenAI, Stripe, Slack, private keys, database credentials and more.',
  },
  {
    icon: Lock,
    title: 'Secrets Never Exposed',
    desc: 'Detected credentials are masked immediately. Only fingerprints and masked values are stored.',
  },
  {
    icon: Eye,
    title: 'Confidence Scoring',
    desc: 'Each finding comes with a confidence score and entropy analysis to minimize false positives.',
  },
  {
    icon: Code2,
    title: 'Custom Rules',
    desc: 'Define your own regex-based detection rules for internal tokens and organization-specific patterns.',
  },
  {
    icon: Terminal,
    title: 'CI/CD Ready',
    desc: 'Designed to become a standalone npm package and GitHub Actions workflow.',
  },
];

// Animated terminal demo content
const DEMO_LINES = [
  { type: 'comment', text: '# Scanning config.js...' },
  { type: 'normal', text: 'const AWS_KEY = "AKIA████████████";' },
  { type: 'finding', text: '⚠  CRITICAL  AWS Access Key ID  line:3  conf:98%' },
  { type: 'normal', text: 'const DB_URL = "postgres://user:████@db.host/prod";' },
  { type: 'finding', text: '⚠  CRITICAL  PostgreSQL Connection  line:7  conf:95%' },
  { type: 'normal', text: 'const TOKEN = "ghp_████████████████████████████████████";' },
  { type: 'finding', text: '⚠  CRITICAL  GitHub PAT  line:12  conf:99%' },
  { type: 'comment', text: '# Scan complete: 3 critical findings in 47ms' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-grid py-24 md:py-32">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.18_155_/_0.1),transparent)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="gap-1.5 text-xs border-primary/30 text-primary bg-primary/5 px-3 py-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Security-first developer tool
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Find Secrets{' '}
                <span className="text-primary text-glow-green">Before They Find</span>{' '}
                Your Production
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Scan source code for accidentally exposed API keys, tokens, passwords, and
                credentials — before they reach git history or production.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/scan">
                  <Button size="lg" className="gap-2 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                    <Zap className="w-4 h-4" />
                    Scan Your Code
                  </Button>
                </Link>
                <Link href="/scan?demo=true">
                  <Button variant="outline" size="lg" className="gap-2 font-semibold border-border/60">
                    <Terminal className="w-4 h-4" />
                    View Demo
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {['No account needed', 'Runs locally', 'Open source', 'Free forever'].map(t => (
                  <span key={t} className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: terminal */}
            <div className="relative">
              <div className="rounded-xl border border-border/50 overflow-hidden bg-[oklch(0.08_0.004_240)] shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">secretshield — scan</span>
                </div>

                {/* Terminal body */}
                <div className="p-4 font-mono text-sm space-y-1.5 min-h-64">
                  {DEMO_LINES.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.type === 'comment' ? 'text-muted-foreground/60' :
                        line.type === 'finding' ? 'text-red-400 font-semibold flex items-center gap-2' :
                        'text-foreground/80'
                      }
                    >
                      {line.type === 'finding' && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{line.text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 text-primary mt-2">
                    <span>$</span>
                    <span className="cursor-blink">▋</span>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-red-900/80 border border-red-700/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-300 shadow-lg">
                3 Critical Findings
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three steps from paste to protected.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Code2,
                title: 'Paste or Upload Code',
                desc: 'Paste source code directly, upload files, or drag and drop entire directories into the scanner.',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Instant Detection',
                desc: '10+ detection rule modules scan for AWS keys, tokens, passwords, private keys, and high-entropy strings.',
              },
              {
                step: '03',
                icon: AlertTriangle,
                title: 'Review & Remediate',
                desc: 'See masked findings with confidence scores, source context, and specific remediation steps.',
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative rounded-xl border border-border/50 bg-card/50 p-6 group hover:border-primary/30 transition-colors">
                  <div className="text-5xl font-black text-primary/10 font-mono absolute top-4 right-4">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detection categories */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">What We Detect</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Production-grade detection rules covering the most common secrets found in codebases.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {DETECTION_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.label} className="rounded-xl border border-border/40 bg-card/50 p-4 hover:border-border/80 transition-colors group">
                  <Icon className={`w-5 h-5 mb-2.5 ${cat.color}`} />
                  <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built for Security</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every design decision prioritizes your security and privacy.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(feat => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="rounded-xl border border-border/40 bg-card/30 p-5 hover:bg-card/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security / Privacy section */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lock className="w-10 h-10 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Your Code Never Leaves Your Machine</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            The scanner engine runs entirely in your browser or on your own Next.js server.
            We never send your source code, credentials, or findings to third-party services.
            Detected secrets are masked immediately and only fingerprints are persisted locally.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              '✓ No analytics on your code',
              '✓ No secret logging',
              '✓ No third-party AI APIs',
              '✓ Masked values only in storage',
              '✓ Open source & auditable',
              '✓ Works fully offline',
            ].map(item => (
              <div key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {item.slice(2)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CI integration teaser */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-border/50 text-muted-foreground">
            Coming Soon
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Integrate Into Your Pipeline</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            The scanner engine is designed as a modular npm package — soon available as a GitHub Actions workflow,
            GitLab CI step, pre-commit hook, and standalone CLI.
          </p>
          <div className="rounded-xl border border-border/50 bg-[oklch(0.08_0.004_240)] p-4 text-left font-mono text-sm max-w-lg mx-auto">
            <p className="text-muted-foreground/60"># Install (coming soon)</p>
            <p className="text-primary">npm install -g secretshield-cli</p>
            <p className="text-muted-foreground/60 mt-2"># Scan your project</p>
            <p className="text-foreground/80">secretshield scan ./src</p>
          </div>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Pricing</h2>
          <p className="text-muted-foreground mb-10">Simple, transparent pricing for every team.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                plan: 'Open Source',
                price: 'Free',
                desc: 'Core scanner, browser-based, local history.',
                features: ['10+ detection rules', 'Custom rules', 'Scan history', 'Local only'],
                cta: 'Start Scanning',
                href: '/scan',
                primary: false,
              },
              {
                plan: 'Team',
                price: 'Coming Soon',
                desc: 'CI integration, team workspace, advanced rules.',
                features: ['Everything in Open Source', 'GitHub Actions', 'API access', 'Team allowlists'],
                cta: 'Get Notified',
                href: '#',
                primary: true,
              },
              {
                plan: 'Enterprise',
                price: 'Custom',
                desc: 'Self-hosted, audit logs, SSO, SLAs.',
                features: ['Self-hosted', 'SSO / SAML', 'Audit logs', 'SLA'],
                cta: 'Contact Us',
                href: '#',
                primary: false,
              },
            ].map(tier => (
              <div
                key={tier.plan}
                className={`rounded-xl border p-6 text-left ${
                  tier.primary
                    ? 'border-primary/40 bg-primary/5 glow-green'
                    : 'border-border/40 bg-card/40'
                }`}
              >
                {tier.primary && (
                  <Badge className="mb-3 text-xs bg-primary/20 text-primary border-primary/30">Most Popular</Badge>
                )}
                <h3 className="font-bold text-base">{tier.plan}</h3>
                <p className="text-2xl font-black text-foreground mt-1 mb-2 font-mono">{tier.price}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tier.desc}</p>
                <ul className="space-y-1.5 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <Button
                    variant={tier.primary ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                  >
                    {tier.cta}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Start scanning in 30 seconds.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            No signup. No credit card. No data leaving your machine. Just paste your code and scan.
          </p>
          <Link href="/scan">
            <Button size="lg" className="gap-2 font-bold text-base px-8 glow-green">
              <Zap className="w-4 h-4" />
              Scan Your Code Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
