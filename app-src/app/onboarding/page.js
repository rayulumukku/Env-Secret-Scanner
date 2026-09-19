'use client';

/**
 * app/onboarding/page.js
 *
 * 6-Step Guided Onboarding Experience.
 * Inspects real application state (organizations, projects, repositories, scans)
 * and automatically marks completed steps with live links for incomplete steps.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, CheckCircle2, Circle, ArrowRight, FolderGit2,
  Terminal, Key, Lock, ArrowUpRight, Zap, RefreshCw, GitBranch, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ONBOARDING_STEPS = [
  {
    id: 1,
    key: 'workspace',
    title: 'Create Workspace & Organization',
    desc: 'Default developer workspace established on registration.',
    href: '/settings/members',
    cta: 'View Workspace',
  },
  {
    id: 2,
    key: 'project',
    title: 'Add Security Project',
    desc: 'Organize repositories into environments (e.g. Production, Staging).',
    href: '/projects',
    cta: 'Create Project',
  },
  {
    id: 3,
    key: 'repository',
    title: 'Connect Repository',
    desc: 'Link a local folder, ZIP archive, or GitHub repository.',
    href: '/scan',
    cta: 'Connect Repo',
  },
  {
    id: 4,
    key: 'scan',
    title: 'Execute First Secret Scan',
    desc: 'Run deterministic scanning over commits and source files.',
    href: '/scan',
    cta: 'Run Scan',
  },
  {
    id: 5,
    key: 'findings',
    title: 'Review & Remediate Findings',
    desc: 'Triage detected credentials or configure baseline suppressions.',
    href: '/findings',
    cta: 'Review Findings',
  },
  {
    id: 6,
    key: 'protection',
    title: 'Configure Continuous Protection',
    desc: 'Install pre-commit hook or activate GitHub PR scanning.',
    href: '/docs/pre-commit',
    cta: 'Setup Hook',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState({
    workspace: true,
    project: false,
    repository: false,
    scan: false,
    findings: false,
    protection: false,
  });
  const [loading, setLoading] = useState(true);

  const checkLiveState = async () => {
    setLoading(true);
    try {
      // Check projects
      const resProjects = await fetch('/api/projects').then(r => r.json()).catch(() => null);
      const hasProjects = resProjects?.success && Array.isArray(resProjects.data) && resProjects.data.length > 0;

      // Check usage / scans
      const resUsage = await fetch('/api/settings/usage').then(r => r.json()).catch(() => null);
      const hasScans = (resUsage?.data?.metrics?.scansCompleted || 0) > 0;
      const hasRepos = (resUsage?.data?.metrics?.repositoriesCount || 0) > 0;
      const hasFindings = (resUsage?.data?.metrics?.findingsDetected || 0) > 0;

      setState({
        workspace: true,
        project: Boolean(hasProjects),
        repository: Boolean(hasRepos || hasScans),
        scan: Boolean(hasScans),
        findings: Boolean(hasFindings || hasScans),
        protection: false, // User can manually toggle or complete via docs
      });
    } catch {
      // Default initial state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLiveState();
  }, []);

  const completedCount = Object.values(state).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-grid pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            SecretShield Security Onboarding
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Set up end-to-end secret detection for your development team across repositories, commits, and CI/CD pipelines.
          </p>

          {/* Progress Bar */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{completedCount} of 6 steps completed</span>
              <span className="font-mono text-primary font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-4">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isDone = state[step.key];

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border/60 bg-secondary/20 hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-secondary text-muted-foreground border border-border/50'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4.5 h-4.5" /> : step.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                        {isDone && (
                          <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>

                  <Link href={step.href}>
                    <Button
                      variant={isDone ? 'ghost' : 'outline'}
                      size="sm"
                      className={`text-xs font-semibold gap-1.5 ${
                        !isDone ? 'border-primary/40 text-primary hover:bg-primary/10' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{step.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkLiveState}
            disabled={loading}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-check Progress
          </Button>

          <Link href="/dashboard">
            <Button className="font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
