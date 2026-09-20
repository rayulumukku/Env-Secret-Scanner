import Link from 'next/link';
import {
  Sparkles, Shield, GitCommit, CheckCircle2,
  Calendar, Tag, ArrowLeft, ArrowRight, Zap, RefreshCw,
  Terminal, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Changelog — SecretShield',
  description: 'Version history, new features, security updates, and performance improvements for SecretShield.',
};

const RELEASES = [
  {
    version: 'v1.0.0',
    date: 'September 20, 2026',
    title: 'SecretShield v1.0.0 — Production Public Launch',
    tag: 'LATEST',
    tagColor: 'bg-primary/20 text-primary border-primary/30',
    summary: 'The official v1.0.0 release of SecretShield. Zero-AI deterministic secret scanning, interactive onboarding, privacy-first telemetry, deep git history inspection, and SARIF 2.1.0 CI/CD support.',
    categories: [
      {
        name: 'New Features',
        items: [
          'Interactive 6-Step Product Tour (/tour) with live simulated previews.',
          'Dashboard Getting Started Checklist with persistent completion tracking.',
          'Automated .secretshield-baseline.json generator to suppress legacy debt safely.',
          'In-App Announcement banner system with broadcast lifecycle management.',
          'Data privacy-conscious analytics pipeline with zero credential recording.',
          'Global Admin portal with RBAC isolation and immutable security audit logs.',
          'Unified Feedback Hub with dedicated False Positive and False Negative triage forms.',
        ],
      },
      {
        name: 'Detection Engine & Security',
        items: [
          'Shannon entropy calculations combined with alphanumeric scoring for generic tokens.',
          '10+ specialized detectors for AWS, Stripe, OpenAI, GitHub, Google Cloud, and Slack.',
          'Context-aware AST heuristics to filter mock values and unit test fixtures.',
          'Automatic ReDoS vulnerability validation on user-submitted custom rules.',
          'Air-gapped architecture guarantee: 0 bytes of source code or secrets sent to external AI.',
        ],
      },
      {
        name: 'Developer Tools & CI/CD',
        items: [
          'Sub-20ms local pre-commit hook via `secretshield install-hook`.',
          'Standardized SARIF 2.1.0 output for native GitHub Code Scanning security tab alerts.',
          'Deep git history scanning across all branches and commits.',
        ],
      },
    ],
  },
  {
    version: 'v0.9.0',
    date: 'September 10, 2026',
    title: 'Release Candidate — Hardening & Multi-Tenancy',
    tag: 'RC',
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    summary: 'Organization multi-tenancy, project scoping, custom rule validation engine, and in-memory credential masking.',
    categories: [
      {
        name: 'Architecture & Governance',
        items: [
          'Multi-tenant Organizations and Projects with role-based access control (OWNER, ADMIN, MEMBER, VIEWER).',
          'In-memory fingerprinting and masking to prevent raw secret persistence in databases or logs.',
          'Security Command Center with repository health posture scoring (0-100).',
        ],
      },
      {
        name: 'Rule Engine',
        items: [
          'Custom Regex Rule Studio with real-time test bench and ReDoS execution limiters.',
          'Granular path ignore patterns matching gitignore specifications.',
        ],
      },
    ],
  },
  {
    version: 'v0.5.0',
    date: 'August 15, 2026',
    title: 'Beta Release — CLI and VS Code Extension',
    tag: 'BETA',
    tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    summary: 'First public beta release featuring the core CLI tool, browser drag-and-drop scanner, and VS Code IDE extension.',
    categories: [
      {
        name: 'Initial Capabilities',
        items: [
          'Core CLI package (@secretshield/cli) published with synchronous and JSON reporting.',
          'Web drag-and-drop scanner with client-side ZIP archive processing.',
          'VS Code extension for real-time editor diagnostic squiggles on exposed tokens.',
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Product Changelog
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                New features, security updates, and performance optimizations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/releases">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5" />
                  Release Notes
                </Button>
              </Link>
              <Link href="/feedback">
                <Button size="sm" className="gap-2 text-xs bg-primary text-primary-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  Request Feature
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Timeline of Releases */}
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-border/60">
          {RELEASES.map((rel) => (
            <div key={rel.version} className="relative pl-10 sm:pl-14 space-y-6">
              {/* Dot on timeline */}
              <div className="absolute left-2.5 sm:left-4.5 -translate-x-1/2 top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary" />

              {/* Release Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-2xl font-black tracking-tight text-foreground font-mono">
                    {rel.version}
                  </span>
                  <Badge variant="outline" className={`text-xs ${rel.tagColor}`}>
                    {rel.tag}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-auto">
                    <Calendar className="w-3.5 h-3.5" />
                    {rel.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{rel.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rel.summary}
                </p>
              </div>

              {/* Release Category Groups */}
              <div className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-6">
                {rel.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                      {cat.name}
                    </h4>
                    <ul className="space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
