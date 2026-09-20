import Link from 'next/link';
import {
  Layers, Shield, ArrowLeft, ArrowRight, FileCode,
  CheckCircle2, Terminal, BookOpen, Sparkles, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Rule Packs Ecosystem — SecretShield Docs',
  description: 'Versioned, declarative secret detection rules architecture, registry, and community ecosystem in SecretShield.',
};

export default function RulesDocOverviewPage() {
  const sections = [
    { title: 'Creating Custom Rules', desc: 'Step-by-step tutorial on writing declarative detection rules with patterns and keywords.', link: '/docs/rules/create' },
    { title: 'Testing & Fixtures', desc: 'How to write synthetic positive and negative test fixtures to guarantee zero false positives.', link: '/docs/rules/testing' },
    { title: 'ReDoS & Safety Standards', desc: 'Catastrophic backtracking prevention, regex limits, and memory safety invariants.', link: '/docs/rules/security' },
    { title: 'Rule Versioning & Semver', desc: 'How rule versions and pack manifests maintain historical finding reproducibility.', link: '/docs/rules/versioning' },
    { title: 'Community Submissions', desc: 'Publishing and contributing verified detection packs to the open-source ecosystem.', link: '/docs/rules/publishing' },
    { title: 'CLI Rule Commands', desc: 'Managing, searching, installing, and testing rule packs via the secretshield command line.', link: '/docs/rules/cli' },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Documentation
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              ARCHITECTURE & SPECIFICATION
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Rule Packs v1.0</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            SecretShield Rule Packs Ecosystem
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            SecretShield utilizes a versioned, declarative rule pack architecture that separates detection logic from execution code. Rules are defined purely in JSON manifests with regular expressions, Shannon entropy thresholds, and keyword heuristics.
          </p>
        </div>

        {/* 5-Tier Precedence Callout */}
        <div className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Deterministic 5-Tier Precedence Engine
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            When multiple rules detect credentials on overlapping file lines, SecretShield deterministically evaluates matches in order of tier priority, preventing alert noise and duplicate notifications:
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <span className="font-bold text-foreground">Tier 1: Core Built-in Rules</span>
              <span className="text-primary font-semibold">Official First-Party</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <span className="font-bold text-foreground">Tier 2: Organization Rule Packs</span>
              <span className="text-emerald-400 font-semibold">Private Enterprise</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <span className="font-bold text-foreground">Tier 3: Project-Scoped Rules</span>
              <span className="text-muted-foreground">Project Boundary</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <span className="font-bold text-foreground">Tier 4: Repository Specific Rules</span>
              <span className="text-muted-foreground">Repo Granularity</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <span className="font-bold text-foreground">Tier 5: Local Custom / Lab Rules</span>
              <span className="text-yellow-400 font-semibold">Developer CLI Sandbox</span>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {sections.map(sec => (
            <Link key={sec.link} href={sec.link} className="group">
              <div className="p-5 rounded-xl border border-border/70 bg-card/40 hover:border-primary/50 transition-all space-y-2 h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    {sec.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sec.desc}</p>
                </div>
                <span className="text-[11px] text-primary font-semibold block pt-2">Read guide &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
