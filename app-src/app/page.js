import Link from 'next/link';
import {
  Shield, Zap, Lock, Eye, Code2, Terminal, ArrowRight,
  CheckCircle2, AlertTriangle, Key, Database,
  Cloud, CreditCard, Bot, FileKey, Globe, GitBranch,
  Cpu, FileCheck, CheckCircle, ShieldCheck, Layers, GitPullRequest,
  Check, HelpCircle, ChevronDown, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveDemo } from '@/components/demo/InteractiveDemo';

export const metadata = {
  title: 'SecretShield — Find Secrets Before They Reach Production',
  description: 'Scan repositories, commits, pull requests, and local changes for exposed credentials — without sending your source code to an AI service.',
};

const DETECTION_CATEGORIES = [
  { icon: Cloud, label: 'AWS Credentials', desc: 'Access keys, secret keys, session tokens', color: 'text-orange-400' },
  { icon: GitBranch, label: 'GitHub Tokens', desc: 'Fine-grained PATs, OAuth, App tokens', color: 'text-purple-400' },
  { icon: Bot, label: 'OpenAI API Keys', desc: 'Project keys & legacy sk- credentials', color: 'text-green-400' },
  { icon: CreditCard, label: 'Stripe Secret Keys', desc: 'Live & test secret keys and webhooks', color: 'text-blue-400' },
  { icon: Globe, label: 'Google Cloud & Firebase', desc: 'API keys, OAuth secrets, service account JSON', color: 'text-red-400' },
  { icon: GitBranch, label: 'Slack Tokens', desc: 'Bot tokens, app tokens, incoming webhooks', color: 'text-yellow-400' },
  { icon: FileKey, label: 'Private Keys & SSH', desc: 'RSA, EC, OpenSSH, PGP private blocks', color: 'text-pink-400' },
  { icon: Database, label: 'Database URIs', desc: 'PostgreSQL, MySQL, Mongo, Redis with passwords', color: 'text-cyan-400' },
  { icon: Key, label: 'Generic Auth & JWTs', desc: 'Bearer tokens, HMAC signatures, API keys', color: 'text-indigo-400' },
  { icon: Code2, label: 'High Entropy Secrets', desc: 'Shannon & alphanumeric entropy scoring', color: 'text-teal-400' },
];

const FAQS = [
  {
    q: 'Does SecretShield send my code to an external AI API (e.g. OpenAI or Anthropic)?',
    a: 'Never. SecretShield operates with a strictly deterministic, privacy-first scanning architecture. All pattern detection, context analysis, entropy calculation, and false positive filtration execute locally in memory on your machine or inside your dedicated deployment.',
  },
  {
    q: 'What happens when a secret is detected? Is it saved to disk?',
    a: 'Raw secrets are NEVER saved to disk or persistent databases. As soon as a credential pattern is identified, it is immediately masked into a secure fingerprint (e.g. AKIAIOSF...MPLE) for triage, ensuring zero exposure in logs, databases, or UI.',
  },
  {
    q: 'How does SecretShield prevent false positives?',
    a: 'Our intelligence layer uses language detection, Shannon entropy calculations, variable context recognition, and customizable baseline suppressions (.secretshield-baseline.json) to eliminate noise from unit tests, mock strings, and documentation examples.',
  },
  {
    q: 'Can SecretShield scan my entire Git commit history?',
    a: 'Yes. The Git history scanner analyzes commit diffs across all branches and historical commits, identifying credentials that were committed and subsequently deleted in later commits.',
  },
  {
    q: 'How can I integrate SecretShield into GitHub and GitLab CI/CD pipelines?',
    a: 'You can use the SecretShield GitHub App for automatic Pull Request scanning, or add our GitHub Actions workflow with SARIF 2.1.0 output to display findings natively inside GitHub Security tabs.',
  },
  {
    q: 'Can I define custom internal regex rules for our proprietary tokens?',
    a: 'Yes. SecretShield includes a full Custom Rules engine with a built-in ReDoS Safety Analyzer and Rule Testing Lab (/rules/lab) so you can safely write and test organization-specific detection regexes.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── 1. HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-grid py-20 md:py-28 border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.18_155_/_0.12),transparent)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge
              variant="outline"
              className="gap-2 text-xs border-primary/30 text-primary bg-primary/5 px-3.5 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Zero-AI Privacy · Deterministic Secret Detection</span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              Find Secrets{' '}
              <span className="text-primary text-glow-green">Before They Reach</span>{' '}
              Production.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Scan source code, Git history, pull requests, and local changes for exposed credentials — without relying on external AI services.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/scan">
                <Button size="lg" className="gap-2 font-bold text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  <Zap className="w-4 h-4" />
                  Scan a Repository
                </Button>
              </Link>
              <Link href="/tour">
                <Button variant="outline" size="lg" className="gap-2 font-semibold text-base px-7 border-border/70 hover:border-primary/50">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Interactive Tour
                </Button>
              </Link>
              <a href="#demo-section">
                <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Terminal className="w-4 h-4" />
                  Try Live Demo
                </Button>
              </a>
            </div>

            {/* Factual Value Props */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 text-xs text-muted-foreground border-t border-border/40 mt-8">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>10+ Rule Engines</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>0 Bytes Sent to AI</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Sub-50ms Engine</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>100% Auditable Local Code</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INTERACTIVE PRODUCT DEMO ───────────────────────────────────────────── */}
      <section id="demo-section" className="py-20 bg-card/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2 text-xs border-primary/30 text-primary">
              Live Product Demo
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Test Secret Detection Right Now
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
              Execute a simulated repository scan with synthetic sample files to see our confidence scoring and remediation workflows in action.
            </p>
          </div>

          <InteractiveDemo />
        </div>
      </section>

      {/* ── 3. THE PROBLEM ────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              The Credential Leakage Epidemic
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Modern development moves fast. A single misplaced API key or database string in Git can compromise production environments in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Git History Persistence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deleting a committed key in a follow-up commit does not remove it from your commit history. Attackers scan public and compromised repos for historical diffs.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Third-Party AI Risks</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sending proprietary repositories to external AI chatbots or cloud scanners risks leaking internal architecture, confidential keys, and compliance breaches.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Alert Fatigue & Noise</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dumb regex tools flag every random UUID or test string. Developers start ignoring alerts when scanners lack context and entropy analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ───────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              How SecretShield Protects You
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three deterministic steps from commit to verified protection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-2xl border border-border/60 bg-card/60 space-y-3">
              <div className="text-5xl font-black text-primary/10 font-mono absolute top-4 right-4">01</div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">1. Local Ingestion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Repositories are scanned in-memory via browser drag-and-drop, ZIP extraction, local CLI, or GitHub PR webhook. Zip bombs and symlink traversals are rejected instantly.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl border border-border/60 bg-card/60 space-y-3">
              <div className="text-5xl font-black text-primary/10 font-mono absolute top-4 right-4">02</div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">2. Intelligence Pipeline</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our multi-layer engine processes files through language detectors, provider rules, Shannon entropy scoring, variable context checks, and false-positive filters.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl border border-border/60 bg-card/60 space-y-3">
              <div className="text-5xl font-black text-primary/10 font-mono absolute top-4 right-4">03</div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">3. Triage & Remediation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Examine masked findings with confidence scores, generate baseline suppression files, view automated rotation guides, and resolve findings collaboratively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DETECTION CAPABILITIES ─────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Comprehensive Detection Capabilities
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Production-grade detection rules covering the most critical credentials across modern cloud infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {DETECTION_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.label} className="rounded-xl border border-border/50 bg-card/40 p-4 hover:border-primary/40 hover:bg-card/70 transition-all group">
                  <Icon className={`w-5 h-5 mb-2.5 ${cat.color}`} />
                  <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. DEVELOPER WORKFLOW & GITHUB INTEGRATION ────────────────────────────── */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                Developer Workflow
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Integrate Seamlessly into Git & CI/CD
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                SecretShield stops credentials before they leave the developer machine and verifies every pull request before merge.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Git Pre-Commit Hook</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Block commits containing secrets in under 20ms before git commit completes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">GitHub App & PR Annotations</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatic PR check runs, inline diff annotations, and security status checks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">SARIF 2.1.0 CI Compatibility</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Standardized SARIF report output ready for GitHub Code Scanning and GitLab Security dashboards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/docs/getting-started">
                  <Button variant="outline" size="sm" className="gap-2 font-semibold">
                    Read Developer Documentation
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Terminal snippet */}
            <div className="rounded-2xl border border-border/70 overflow-hidden bg-[oklch(0.08_0.004_240)] shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">terminal — secretshield</span>
                </div>
              </div>
              <div className="p-5 font-mono text-xs space-y-2.5">
                <p className="text-muted-foreground/60"># 1. Install pre-commit hook</p>
                <p className="text-primary">$ secretshield install-hook</p>
                <p className="text-emerald-400">✔ SecretShield pre-commit hook installed into .git/hooks/pre-commit</p>

                <p className="text-muted-foreground/60 pt-2"># 2. Run scan on staged changes</p>
                <p className="text-primary">$ git commit -m &quot;feat: add payment gateway&quot;</p>
                <p className="text-red-400 font-semibold">✖ SecretShield: 1 exposed secret detected in staged files!</p>
                <p className="text-muted-foreground pl-4">→ Stripe Secret Key at src/payment.js:14 (Confidence: 98%)</p>
                <p className="text-red-400 pl-4 font-semibold">Commit rejected. Mask and remove credentials to continue.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PRIVACY ARCHITECTURE ──────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Privacy-First Architecture
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">
            Security software should never create a secondary data leakage vector. SecretShield is engineered from the ground up for strict data confidentiality.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto pt-4">
            <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Zero External AI Endpoints
              </span>
              <p className="text-xs text-muted-foreground">Your source code is never sent to OpenAI, Anthropic, or external model providers.</p>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Immediate In-Memory Masking
              </span>
              <p className="text-xs text-muted-foreground">Detected credentials are masked immediately; raw secret values are never saved to disk or DB.</p>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Complete Source Auditing
              </span>
              <p className="text-xs text-muted-foreground">All detection regexes, intelligence pipelines, and ReDoS guards are open source and verifiable.</p>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Air-Gapped & Self-Hosted Ready
              </span>
              <p className="text-xs text-muted-foreground">Deploy entirely within your private VPC or on-premise infrastructure without internet dependency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS ────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30 bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Answers to common architectural, operational, and security questions.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-border/60 bg-card/50 space-y-2">
                <h4 className="font-semibold text-base text-foreground flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Protect Your Repositories in 30 Seconds.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Free, open, and private. Paste your code, upload a repository archive, or connect your GitHub organization.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/scan">
              <Button size="lg" className="gap-2 font-bold text-base px-8 glow-green">
                <Zap className="w-4 h-4" />
                Scan Code Now
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="font-semibold text-base px-6">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
