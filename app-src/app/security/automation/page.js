'use client';

/**
 * app/security/automation/page.js
 *
 * Autonomous Security Operations Queue & Approval Center for SecretShield.
 * Tracks automated actions, approval gates, and execution statuses.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityAutomationPage() {
  const [data, setData] = useState({ actions: [], pendingApprovals: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approvals'); // approvals | queue
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchAutomationQueue();
  }, []);

  async function fetchAutomationQueue() {
    try {
      setLoading(true);
      const res = await fetch('/api/security/automation');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(id, verdict) {
    try {
      setActionLoading(id);
      const endpoint = `/api/security/actions/${id}/${verdict.toLowerCase()}`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: `Action ${verdict} via Web Console` }),
      });
      await fetchAutomationQueue();
    } catch {
      // fallback
    } finally {
      setActionLoading(null);
    }
  }

  const { actions = [], pendingApprovals = [] } = data;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <Layers className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Automation Queue</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Autonomous Security Operations</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Continuous policy enforcement, automated playbook actions, and human-in-the-loop approval gates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/security/automation/health">
                <Button variant="outline" size="sm" className="gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Automation Health
                </Button>
              </Link>
              <Link href="/security/simulate">
                <Button variant="outline" size="sm" className="gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  Dry-Run Simulator
                </Button>
              </Link>
              <Link href="/settings/playbooks">
                <Button size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Manage Playbooks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Pending Approvals
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
              {pendingApprovals.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Action Execution History
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
              {actions.length}
            </Badge>
          </button>
        </div>

        {/* Tab 1: Approval Gates */}
        {activeTab === 'approvals' && (
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Required Human-in-the-Loop Approvals ({pendingApprovals.length})
                </CardTitle>
                <Button onClick={fetchAutomationQueue} variant="ghost" size="sm">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingApprovals.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-medium">All Approvals Clear</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Zero automation actions are currently awaiting authorization.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {pendingApprovals.map((appr) => (
                    <div key={appr.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{appr.actionType}</span>
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">PENDING APPROVAL</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{appr.reason}</p>
                        <div className="text-[11px] text-muted-foreground flex gap-4 font-mono">
                          <span>Target: {appr.targetId}</span>
                          <span>Requested: {new Date(appr.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          disabled={actionLoading === appr.id}
                          onClick={() => handleApproval(appr.id, 'APPROVE')}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          disabled={actionLoading === appr.id}
                          onClick={() => handleApproval(appr.id, 'REJECT')}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Action History */}
        {activeTab === 'queue' && (
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-base font-semibold">
                Executed Automation Actions ({actions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {actions.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h3 className="text-base font-medium">No Actions Executed Yet</h3>
                  <p className="text-xs text-muted-foreground">
                    Triggered playbook actions will appear in this execution queue.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {actions.map((act) => (
                    <div key={act.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{act.actionType}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {act.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-4">
                          {act.playbookId && <span>Playbook: <span className="font-mono text-foreground">{act.playbookId}</span></span>}
                          <span>Time: {new Date(act.executedAt || act.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        ID: {act.id.slice(0, 10)}...
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
