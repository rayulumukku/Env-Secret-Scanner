'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Zap, GitBranch, Terminal, CheckCircle2,
  ArrowRight, ArrowLeft, RefreshCw, Key,
  Check, Lock, Sparkles, AlertTriangle, Cpu, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics/tracker';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

const TOUR_STEPS = [
  {
    id: 'engine',
    title: 'Zero-AI Secret Detection Engine',
    tagline: 'High-speed, deterministic pattern and entropy scanning',
    description: 'SecretShield analyzes source code using 10+ provider rule engines combined with Shannon entropy calculations. Every scan runs 100% locally or inside your dedicated VPC — zero code or secrets are ever sent to external AI services.',
    icon: Cpu,
    color: 'text-primary',
    previewType: 'engine',
  },
  {
    id: 'git-history',
    title: 'Deep Git History Scanning',
    tagline: 'Uncover secrets committed in the past and deleted later',
    description: 'A secret deleted in a follow-up commit still lives forever in git logs. SecretShield recursively parses commit trees, branch heads, and diff histories to pinpoint the exact commit SHA where credentials leaked.',
    icon: GitBranch,
    color: 'text-purple-400',
    previewType: 'git',
  },
  {
    id: 'findings',
    title: 'Masked Findings & Triage Hub',
    tagline: 'Zero raw credential persistence with instant confidence scoring',
    description: 'Identified secrets are immediately masked into non-reversible fingerprints (e.g. AKIAIOSF••••••••). Findings display location, confidence score, entropy metrics, and historical blast radius.',
    icon: Shield,
    color: 'text-amber-400',
    previewType: 'findings',
  },
  {
    id: 'remediation',
    title: '1-Click Remediation & Suppression',
    tagline: 'Rotation playbooks and deterministic baseline files',
    description: 'Generate .secretshield-baseline.json to suppress legacy known findings without ignoring new regressions. Copy provider-specific key rotation runbooks and git filter-repo purge commands in one click.',
    icon: RefreshCw,
    color: 'text-emerald-400',
    previewType: 'remediation',
  },
  {
    id: 'cicd',
    title: 'CI/CD & Pre-Commit Protection',
    tagline: 'Shift-left security with sub-20ms local hook execution',
    description: 'Prevent credentials from ever leaving developer laptops with secretshield install-hook. In CI/CD, generate SARIF 2.1.0 reports for GitHub Code Scanning and block PR merges with our automated GitHub App.',
    icon: Terminal,
    color: 'text-blue-400',
    previewType: 'cicd',
  },
  {
    id: 'security-center',
    title: 'Security Command Center & Policies',
    tagline: 'Continuous posture visibility and enterprise governance',
    description: 'Monitor repository health scores across your entire organization. Configure strict branch protection policies, automated Slack alert webhooks, and complete admin audit logs.',
    icon: Lock,
    color: 'text-teal-400',
    previewType: 'security',
  },
];

export default function ProductTourPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, { step: currentStep + 1 });
  }, [currentStep]);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secretshield_tour_completed', 'true');
    }
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { totalSteps: TOUR_STEPS.length });
    router.push('/scan');
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secretshield_tour_completed', 'true');
    }
    trackEvent(ANALYTICS_EVENTS.FEEDBACK_MODAL_DISMISSED, { action: 'tour_skipped' });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Interactive Product Tour</h1>
            <p className="text-xs text-muted-foreground">Discover how SecretShield stops credentials before production</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
            Skip Tour
          </Button>
        </div>
      </div>

      {/* Main Tour Body */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8">
        {/* Step Progress Dots */}
        <div className="flex items-center justify-between mb-8">
          {TOUR_STEPS.map((s, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className="flex-1 text-left group focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary/20 border-2 border-primary text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium hidden md:inline truncate ${
                    isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}>
                    {s.title.split(' ')[0]}
                  </span>
                </div>
                <div className={`h-1 rounded-full mt-2 transition-all ${
                  isDone || isCurrent ? 'bg-primary' : 'bg-border/60'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="grid lg:grid-cols-12 gap-8 items-center bg-card/40 border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          {/* Left Info Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1.5 text-xs ${step.color} border-current/20 bg-current/5`}>
                <step.icon className="w-3.5 h-3.5" />
                {step.tagline}
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {step.title}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Factual Highlights */}
            <div className="pt-2 space-y-2.5">
              {currentStep === 0 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Sub-50ms execution on standard repositories</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>10+ specialized detectors for AWS, Stripe, OpenAI, GitHub, GCP, Slack</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Context-aware AST heuristics to ignore test fixtures and mock values</span>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Deep git commit tree diffing across all commits</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Commit SHA, author, timestamp, and commit message tracing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Instant git filter-repo commands for historical purging</span>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Confidence scoring (0-100%) based on Shannon entropy & pattern precision</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Zero raw secret storage — automatic irreversible masking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Severity triage (Critical, High, Medium, Low)</span>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Generate .secretshield-baseline.json to ignore existing debt cleanly</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Provider-specific credential revocation and rotation instructions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Copyable BFG Repo-Cleaner & git filter-repo recipes</span>
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Pre-commit hooks that run in &lt;20ms on staged changes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>GitHub Actions workflow integration with SARIF 2.1.0 upload</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Automated Pull Request inline review comments and status checks</span>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Enterprise Security Posture score across all active repositories</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Branch protection enforcement rules to reject PRs with secrets</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Immutable security audit logging with zero credential leakage</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Interactive/Visual Preview Column */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border/80 bg-[oklch(0.08_0.005_240)] p-5 font-mono text-xs shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="text-[11px] text-muted-foreground ml-2">demo_preview.sh [DEMO]</span>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                  Live Component
                </Badge>
              </div>

              {/* Preview 0: Engine */}
              {step.previewType === 'engine' && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground/70"># Initializing Local Deterministic Engine</p>
                  <p className="text-primary font-bold">&gt; secretshield scan ./src --entropy</p>
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/40 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">Shannon Entropy Calculation:</span>
                      <span className="text-emerald-400 font-bold">4.82 bits/char (High)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">Detector:</span>
                      <span className="text-yellow-400 font-bold">AWS Access Key Pattern</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">Scan Latency:</span>
                      <span className="text-cyan-400 font-bold">14.2 ms</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">External AI Calls:</span>
                      <span className="text-primary font-bold">0 (Air-gapped)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview 1: Git */}
              {step.previewType === 'git' && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground/70"># Scanning Git Commit Tree</p>
                  <p className="text-purple-400 font-bold">&gt; secretshield history --all-branches</p>
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 font-bold">Commit 8f3c2a1: Stripe Secret Key</span>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">HISTORICAL</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">Author: dev@company.internal · 14 days ago</p>
                    <p className="text-amber-300 text-[11px]">Status: Key deleted in commit 4b1e9c, but preserved in git reflog!</p>
                  </div>
                </div>
              )}

              {/* Preview 2: Findings */}
              {step.previewType === 'findings' && (
                <div className="space-y-2.5 text-left">
                  <p className="text-muted-foreground/70"># Triaging Active Findings</p>
                  <div className="bg-card/70 border border-border/70 p-3.5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="font-semibold text-foreground">OpenAI Project API Key</span>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">CRITICAL</Badge>
                    </div>
                    <div className="p-2 rounded bg-background/60 border border-border/40 font-mono text-[11px] text-muted-foreground">
                      <span>Found: </span>
                      <span className="text-emerald-400 font-bold">sk-proj-••••••••••••••••3A9x</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Location: src/ai/client.ts:8</span>
                      <span className="text-primary">Confidence: 99%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview 3: Remediation */}
              {step.previewType === 'remediation' && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground/70"># Generating Suppression Baseline</p>
                  <p className="text-emerald-400 font-bold">&gt; secretshield baseline --generate</p>
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/40 font-mono text-[11px] space-y-1">
                    <p className="text-muted-foreground">&#123;</p>
                    <p className="text-muted-foreground pl-4">&quot;version&quot;: &quot;1.0.0&quot;,</p>
                    <p className="text-foreground pl-4">&quot;suppressedCount&quot;: 3,</p>
                    <p className="text-emerald-400 pl-4">&quot;generatedAt&quot;: &quot;2026-09-20T16:00:00Z&quot;</p>
                    <p className="text-muted-foreground">&#125;</p>
                    <p className="text-primary text-[10px] pt-1">✔ .secretshield-baseline.json created. New leaks will still fail CI!</p>
                  </div>
                </div>
              )}

              {/* Preview 4: CI/CD */}
              {step.previewType === 'cicd' && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground/70"># Pull Request Security Check</p>
                  <div className="bg-secondary/40 border border-border/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-semibold">GitHub Action: secretshield-scan</span>
                      <span className="text-red-400 font-bold">FAILURE</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Annotated PR #42 at <span className="text-yellow-300">config/db.js:12</span> with 1 High severity secret.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px]">SARIF 2.1.0 Exported</Badge>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Exit Code: 1</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview 5: Security */}
              {step.previewType === 'security' && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground/70"># Enterprise Security Posture</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-secondary/30 p-2.5 rounded border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Posture Score</span>
                      <span className="text-xl font-bold text-primary">94/100</span>
                    </div>
                    <div className="bg-secondary/30 p-2.5 rounded border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Branch Policy</span>
                      <span className="text-sm font-semibold text-emerald-400">ENFORCED</span>
                    </div>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded border border-border/30 text-[10px] text-muted-foreground flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>0 Critical secrets in main branch</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirst}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </Button>

          <div className="flex items-center gap-3">
            <Link href="/docs/getting-started">
              <Button variant="ghost" className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                <HelpCircle className="w-4 h-4 mr-1.5" />
                Read Docs
              </Button>
            </Link>

            <Button
              onClick={handleNext}
              className="gap-2 font-bold px-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
            >
              {isLast ? 'Complete Tour & Start Scanning' : 'Next Step'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        SecretShield v1.0.0 · Local, deterministic, zero-AI secret detection for engineering teams.
      </div>
    </div>
  );
}
