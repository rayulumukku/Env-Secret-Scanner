'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Shield, Layers, Plus, ArrowLeft, CheckCircle2,
  Lock, Settings, RefreshCw, AlertTriangle, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function OrgRulesPage() {
  const { orgId } = useParams();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');

  useEffect(() => {
    loadOrgPacks();
  }, [orgId]);

  const loadOrgPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rules/packs?organizationId=${orgId}`);
      const data = await res.json();
      if (data.data?.custom) {
        setPacks(data.data.custom);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrgPack = async (e) => {
    e.preventDefault();
    if (!newPackName || !newRulePattern) return;

    try {
      const res = await fetch('/api/rules/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackName,
          description: newPackDesc,
          organizationId: orgId,
          rules: [
            {
              id: `org_${newPackName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1`,
              name: newPackName,
              description: newPackDesc || 'Organization private detection rule',
              provider: 'Organization Internal',
              category: 'Custom',
              severity: 'HIGH',
              version: '1.0.0',
              patterns: [newRulePattern],
            }
          ],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewPackName('');
        setNewPackDesc('');
        setNewRulePattern('');
        loadOrgPacks();
      }
    } catch {
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href={`/organizations/${orgId}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Organization
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  ORGANIZATION GOVERNANCE
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Tier 2 Precedence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Private Organization Rule Packs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage proprietary internal token patterns, enforce mandatory packs, and configure project scoping.
              </p>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Private Rule Pack
            </Button>
          </div>
        </div>

        {/* Precedence Hierarchy Callout */}
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Deterministic Precedence Resolution
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When multiple rules detect credentials on the same line/token, SecretShield resolves them according to the 5-tier precedence hierarchy:
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
            <span className="p-1.5 rounded bg-secondary text-foreground">1. Built-in Core</span>
            <span>&rarr;</span>
            <span className="p-1.5 rounded bg-primary/20 text-primary font-bold">2. Organization Packs</span>
            <span>&rarr;</span>
            <span className="p-1.5 rounded bg-secondary text-foreground">3. Project Rules</span>
            <span>&rarr;</span>
            <span className="p-1.5 rounded bg-secondary text-foreground">4. Repo Rules</span>
            <span>&rarr;</span>
            <span className="p-1.5 rounded bg-secondary text-foreground">5. Local Custom</span>
          </div>
        </div>

        {/* List of Org Rule Packs */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Active Organization Packs ({packs.length})</h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
              Loading organization rules...
            </div>
          ) : packs.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-border/70 bg-card/20 space-y-3">
              <FileCode className="w-8 h-8 text-muted-foreground mx-auto" />
              <h4 className="font-bold text-sm text-foreground">No Private Rule Packs Configured</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Create custom detection rules for your proprietary internal microservice tokens, SSO headers, or internal API keys.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {packs.map(p => (
                <div key={p.id} className="rounded-xl border border-border/70 bg-card/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{p.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">v{p.version}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.description || 'No description'}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/40 font-mono">
                    <span>{p.rules?.length || 0} rules</span>
                    <span className="text-emerald-400 font-bold">ENFORCED</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <form onSubmit={handleCreateOrgPack} className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-foreground">Create Private Rule Pack</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Pack Name *</label>
                <input
                  type="text"
                  required
                  value={newPackName}
                  onChange={e => setNewPackName(e.target.value)}
                  placeholder="e.g. Internal Microservice Tokens"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  value={newPackDesc}
                  onChange={e => setNewPackDesc(e.target.value)}
                  placeholder="Detect internal authentication headers and private VPC keys"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Initial Detection Pattern *</label>
                <input
                  type="text"
                  required
                  value={newRulePattern}
                  onChange={e => setNewRulePattern(e.target.value)}
                  placeholder="e.g. internal_sec_[A-Za-z0-9]{32}"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-bold">
                  Save Rule Pack
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
