import Link from 'next/link';
import {
  ShieldCheck, Lock, CheckCircle2, XCircle, ArrowLeft,
  FileCode, Terminal, AlertTriangle, Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy & Telemetry Specification — SecretShield Docs',
  description: 'Technical privacy architecture, zero-PII guarantees, and telemetry data handling in SecretShield.',
};

export default function AnalyticsPrivacyDocPage() {
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
              PRIVACY SPECIFICATION
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Version 1.0</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Product Telemetry & Data Privacy Policy
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            SecretShield is built for security-conscious developers and regulated enterprises. This document provides complete transparency into our deterministic architecture and telemetry sanitization pipeline.
          </p>
        </div>

        {/* The Core Privacy Invariant */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              The SecretShield Zero-Leakage Guarantee
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your source code, file contents, environment files, and detected credentials <strong>never leave your machine or private VPC</strong>. All pattern matching, Shannon entropy calculations, and false positive AST heuristics run deterministically in local memory.
          </p>
        </div>

        {/* Tracked vs Never Tracked Comparison */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Never Tracked */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <h3 className="font-bold text-base text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              What Is NEVER Collected or Logged
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Raw Secret Values:</strong> Tokens, API keys, passwords, private keys.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Source Code Content:</strong> Code lines, functions, comments, or repository archives.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>File Paths & Repo Names:</strong> Internal directory hierarchies or proprietary naming schemes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Git Author Details:</strong> Commit authors, personal emails, or private commit messages.</span>
              </li>
            </ul>
          </div>

          {/* Collected Aggregates */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
            <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              What Is Anonymously Aggregated
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Operational Counts:</strong> Total scans executed, total baselines generated.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Rule Trigger Counts:</strong> Count of findings grouped by Rule ID (e.g. AWS_ACCESS_KEY).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Performance Benchmarks:</strong> Millisecond engine execution latency.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Feature Adoption:</strong> Completion of onboarding checklist steps.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Sanitizer Pipeline */}
        <div className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Automated Ingest Sanitization Architecture
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every telemetry event passes through our strict payload sanitizer before persistence or forwarding. Any payload key matching forbidden substrings (like <code className="text-primary font-mono">secret</code>, <code className="text-primary font-mono">token</code>, <code className="text-primary font-mono">key</code>, <code className="text-primary font-mono">password</code>, <code className="text-primary font-mono">auth</code>, <code className="text-primary font-mono">code</code>) is stripped in memory:
          </p>

          <div className="rounded-xl border border-border/60 bg-[oklch(0.08_0.005_240)] p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
            <p className="text-primary">// lib/analytics/tracker.js</p>
            <p className="text-foreground">function sanitizeEventProperties(properties) &#123;</p>
            <p className="pl-4">const FORBIDDEN_KEYS = [&apos;secret&apos;, &apos;token&apos;, &apos;key&apos;, &apos;password&apos;, &apos;content&apos;, &apos;code&apos;, &apos;filePath&apos;];</p>
            <p className="pl-4">...</p>
            <p className="pl-4 text-emerald-400">// Automatically masks and strips dangerous fields</p>
            <p className="text-foreground">&#125;</p>
          </div>
        </div>

        {/* Air-Gapped Mode */}
        <div className="rounded-2xl border border-border/70 bg-card/40 p-6 space-y-3">
          <h3 className="text-base font-bold text-foreground">Air-Gapped & Offline Verification</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you run SecretShield in a high-security defense or healthcare environment, you can disable all external network traffic completely. SecretShield operates with zero cloud dependencies.
          </p>
        </div>
      </div>
    </div>
  );
}
