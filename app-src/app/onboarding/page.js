'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, CheckCircle2, Circle, ArrowRight, FolderGit2,
  Terminal, Key, Lock, ArrowUpRight, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 1, title: 'Create Organization', desc: 'Default workspace established on registration' },
  { id: 2, title: 'Create First Project', desc: 'Group repositories and set security policy' },
  { id: 3, title: 'Connect Repository', desc: 'Link a local or remote Git repository' },
  { id: 4, title: 'Execute First Scan', desc: 'Run high-speed secret detection on source files' },
  { id: 5, title: 'Triage Findings', desc: 'Remediate or allowlist detected credentials' },
  { id: 6, title: 'Install Pre-Commit Hook', desc: 'Prevent future leaks before they reach Git' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(2);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations/active/projects')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setProjects(res.data);
          if (res.data.length > 0) {
            setActiveStep(3);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-grid pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to SecretShield
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Let&apos;s set up your zero-trust secret protection pipeline in just a few steps.
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xl mb-8">
          <div className="space-y-6">
            {STEPS.map((step, idx) => {
              const isCompleted = step.id < activeStep;
              const isCurrent = step.id === activeStep;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      isCurrent ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse' :
                      'bg-secondary text-muted-foreground border border-border/40'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 my-1 ${isCompleted ? 'bg-emerald-500/40' : 'bg-border/40'}`} />
                    )}
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                        {step.title}
                      </h3>
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Action Box */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Ready for your next step?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {projects.length === 0
                ? 'Create your first project to start scanning repositories.'
                : 'Run a scan on source files or install the pre-commit hook.'}
            </p>
          </div>

          <div className="flex gap-2">
            {projects.length === 0 ? (
              <Link href="/projects/new">
                <Button className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  Create Project <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/scan">
                <Button className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Run First Scan
                </Button>
              </Link>
            )}

            <Link href="/dashboard">
              <Button variant="outline" className="text-xs border-border/60">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
