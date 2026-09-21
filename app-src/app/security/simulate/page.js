'use client';

/**
 * app/security/simulate/page.js
 *
 * Dry-Run Policy & Playbook Simulator for SecretShield.
 * Allows security engineers to test policy & playbook conditions before deploying to production.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecuritySimulatePage() {
  const [eventType, setEventType] = useState('SECRET_DETECTED');
  const [severity, setSeverity] = useState('HIGH');
  const [category, setCategory] = useState('API_KEY');
  const [branch, setBranch] = useState('main');
  const [isProduction, setIsProduction] = useState(true);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  async function handleSimulate() {
    try {
      setLoading(true);
      const res = await fetch('/api/security/automation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          severity,
          category,
          branch,
          isProduction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/security/automation" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Automation
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Playbook & Policy Simulator</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Test declarative response playbooks against synthetic events in a safe, zero-side-effect sandbox.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings/playbooks">
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Edit Playbooks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Configuration */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Synthetic Event Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground focus:outline-none"
                >
                  <option value="SECRET_DETECTED">SECRET_DETECTED</option>
                  <option value="SECRET_REINTRODUCED">SECRET_REINTRODUCED</option>
                  <option value="POLICY_VIOLATION">POLICY_VIOLATION</option>
                  <option value="SCAN_COMPLETED">SCAN_COMPLETED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Rule Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground focus:outline-none"
                >
                  <option value="API_KEY">API_KEY</option>
                  <option value="CLOUD_PROVIDER">CLOUD_PROVIDER</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="PRIVATE_KEY">PRIVATE_KEY</option>
                  <option value="TOKEN">TOKEN</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Target Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Production Environment</span>
                <input
                  type="checkbox"
                  checked={isProduction}
                  onChange={(e) => setIsProduction(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
              </div>

              <Button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full gap-2 mt-4"
              >
                <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Evaluating...' : 'Run Simulation'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Simulation Output */}
        <div className="lg:col-span-2 space-y-6">
          {!simulationResult ? (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="py-20 text-center space-y-3">
                <Play className="w-10 h-10 text-primary/60 mx-auto" />
                <h3 className="text-base font-medium">Ready to Simulate</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Configure the synthetic event parameters on the left and click "Run Simulation" to evaluate all organization playbooks.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-300">Dry-Run Mode Active:</span>{' '}
                  <span className="text-muted-foreground">{simulationResult.notice}</span>
                </div>
              </div>

              {/* Simulation Metrics Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs text-muted-foreground">Evaluated</span>
                    <p className="text-xl font-bold">{simulationResult.totalPlaybooksEvaluated}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs text-muted-foreground">Matched</span>
                    <p className="text-xl font-bold text-emerald-400">{simulationResult.totalPlaybooksMatched}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs text-muted-foreground">Proposed Actions</span>
                    <p className="text-xl font-bold text-primary">{simulationResult.totalProposedActions}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Playbook Evaluation Breakdown */}
              <Card className="border-border/60 bg-card/60">
                <CardHeader className="py-4 border-b border-border/60">
                  <CardTitle className="text-base font-semibold">
                    Playbook Evaluation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {simulationResult.evaluations?.map((ev, i) => (
                    <div key={i} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{ev.name || 'Unnamed Playbook'}</span>
                          <Badge className={ev.matched ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                            {ev.matched ? 'MATCHED' : 'NO MATCH'}
                          </Badge>
                          {ev.approvalRequired && (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                              Requires Approval
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-muted-foreground font-medium block">Conditions Evaluated:</span>
                        {ev.conditionEvaluations?.map((cond, ci) => (
                          <div key={ci} className="flex items-center gap-2 font-mono text-[11px]">
                            {cond.matched ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className={cond.matched ? 'text-foreground' : 'text-muted-foreground'}>
                              {cond.reason}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      {ev.proposedActions?.length > 0 && (
                        <div className="space-y-1 text-xs pt-2 border-t border-border/40">
                          <span className="text-muted-foreground font-medium block">Actions that would trigger:</span>
                          <div className="flex flex-wrap gap-2">
                            {ev.proposedActions.map((act, ai) => (
                              <Badge key={ai} variant="secondary" className="font-mono text-xs">
                                {typeof act === 'string' ? act : act.type || JSON.stringify(act)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
