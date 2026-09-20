'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, RefreshCw, CheckCircle2,
  TrendingDown, ShieldCheck, Users, HelpCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminActivationFunnelPage() {
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunnel();
  }, []);

  const loadFunnel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics/activation');
      const data = await res.json();
      if (data.data) {
        setFunnelData(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'landing_view', label: '1. Landing Page Visit', count: funnelData?.landingViews ?? 0 },
    { id: 'scan_run', label: '2. Executed First Scan', count: funnelData?.firstScans ?? 0 },
    { id: 'finding_triage', label: '3. Triaged Secret Findings', count: funnelData?.findingsTriaged ?? 0 },
    { id: 'baseline_gen', label: '4. Generated Baseline File', count: funnelData?.baselinesGenerated ?? 0 },
    { id: 'ci_integrated', label: '5. Integrated CI / Hook', count: funnelData?.ciIntegrations ?? 0 },
  ];

  const hasSufficientData = steps[0].count > 0;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Analytics
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  USER ACTIVATION
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Conversion Funnel</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Onboarding & Activation Funnel
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Anonymous lifecycle progression from initial visit to CI protection.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadFunnel}
              disabled={loading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Funnel Visualisation */}
        {!hasSufficientData ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-base text-foreground">Not Enough Data to Calculate Conversion</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Activation conversion percentages require baseline usage activity. As users complete interactive scans and install git hooks, rates will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const maxCount = steps[0].count || 1;
              const percent = Math.round((step.count / maxCount) * 100);
              return (
                <div key={step.id} className="rounded-xl border border-border/70 bg-card/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-muted-foreground font-semibold">
                        {step.count} events
                      </span>
                      <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                        {percent}%
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note */}
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <span>
            Funnel calculations rely entirely on anonymous event identifiers. User sessions and repository contents are strictly excluded.
          </span>
        </div>
      </div>
    </div>
  );
}
