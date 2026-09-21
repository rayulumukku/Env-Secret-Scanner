'use client';

/**
 * app/settings/playbooks/page.js
 *
 * Security Playbooks Management Center for SecretShield.
 * Declarative condition/action playbooks for automated incident response.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PlaybooksSettingsPage() {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  async function fetchPlaybooks() {
    try {
      setLoading(true);
      const res = await fetch('/api/security/playbooks');
      const json = await res.json();
      if (json.success) {
        setPlaybooks(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePlaybook(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/security/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          conditions: [
            { field: 'severity', operator: 'gte', value: 'HIGH' },
            { field: 'isProduction', operator: 'is_true', value: true },
          ],
          actions: [
            'CREATE_REMEDIATION_TASK',
            'NOTIFY_SECURITY_CHANNEL',
            'FAIL_PR_CHECK',
          ],
          approvalRequired: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewDesc('');
        setIsCreating(false);
        await fetchPlaybooks();
      }
    } catch {
      // fallback
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
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Response Automation</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Response Playbooks</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Define declarative IF-THEN automation rules to automatically triage, notify, block CI, and assign remediation tasks.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/security/simulate">
                <Button variant="outline" size="sm" className="gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  Simulator
                </Button>
              </Link>
              <Button size="sm" onClick={() => setIsCreating(!isCreating)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Playbook
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Create Modal / Form */}
        {isCreating && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="py-4 border-b border-primary/20">
              <CardTitle className="text-base font-semibold">Create New Security Playbook</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleCreatePlaybook} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Playbook Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Auto-Triage Critical Production Secrets"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of the automated response objective"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" size="sm">Create & Configure</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Playbooks List */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Configured Playbooks ({playbooks.length})
              </CardTitle>
              <Button onClick={fetchPlaybooks} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {playbooks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-medium">No Playbooks Configured</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create your first declarative playbook to automatically handle detected secrets according to your organization's policy.
                </p>
                <Button size="sm" onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Default Playbook
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {playbooks.map((pb) => (
                  <div key={pb.id} className="p-4 hover:bg-muted/10 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/playbooks/${pb.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                          {pb.name}
                        </Link>
                        <Badge className={pb.isEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                          {pb.isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </Badge>
                        {pb.approvalRequired && (
                          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                            Approval Gate
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{pb.description || 'No description provided'}</p>
                      <div className="text-[11px] text-muted-foreground flex gap-4 pt-1">
                        <span>Conditions: <span className="font-mono text-foreground">{pb.conditions?.length || 0}</span></span>
                        <span>Actions: <span className="font-mono text-foreground">{pb.actions?.length || 0}</span></span>
                        <span>Version: <span className="font-mono text-foreground">{pb.version}</span></span>
                      </div>
                    </div>

                    <Link href={`/playbooks/${pb.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Configure
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
