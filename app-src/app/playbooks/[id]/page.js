'use client';

/**
 * app/playbooks/[id]/page.js
 *
 * Visual Declarative Playbook Editor & Tester for SecretShield.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PlaybookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (id) fetchPlaybook();
  }, [id]);

  async function fetchPlaybook() {
    try {
      setLoading(true);
      const res = await fetch(`/api/security/playbooks/${id}`);
      const json = await res.json();
      if (json.success) {
        setPlaybook(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await fetch(`/api/security/playbooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playbook),
      });
      await fetchPlaybook();
    } catch {
      // fallback
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this security playbook?')) return;
    try {
      await fetch(`/api/security/playbooks/${id}`, { method: 'DELETE' });
      router.push('/settings/playbooks');
    } catch {
      // fallback
    }
  }

  async function handleTest() {
    try {
      const res = await fetch(`/api/security/playbooks/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'SECRET_DETECTED',
          severity: 'HIGH',
          category: 'API_KEY',
          isProduction: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.data.evalResult);
      }
    } catch {
      // fallback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 text-center space-y-4">
        <p className="text-muted-foreground">Playbook not found.</p>
        <Link href="/settings/playbooks">
          <Button variant="outline" size="sm">Back to Playbooks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/settings/playbooks" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Playbooks
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{playbook.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{playbook.description || 'Declarative automated response rule'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleTest} variant="outline" size="sm" className="gap-2">
                <Play className="w-4 h-4 text-primary" />
                Test Playbook
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Settings Toggle Bar */}
        <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={playbook.isEnabled}
                onChange={(e) => setPlaybook({ ...playbook, isEnabled: e.target.checked })}
                className="rounded border-border"
              />
              Playbook Enabled
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={playbook.approvalRequired}
                onChange={(e) => setPlaybook({ ...playbook, approvalRequired: e.target.checked })}
                className="rounded border-border"
              />
              Require Human Approval Gate
            </label>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            v{playbook.version}
          </Badge>
        </div>

        {/* Declarative Conditions & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conditions */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>IF Conditions ({playbook.conditions?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {playbook.conditions?.map((c, idx) => (
                <div key={idx} className="p-3 rounded bg-muted/40 border border-border/60 text-xs space-y-1 font-mono">
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Field: {c.field}</span>
                    <span className="text-primary">{c.operator}</span>
                  </div>
                  <div className="text-muted-foreground">Value: {JSON.stringify(c.value)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                THEN Actions ({playbook.actions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {playbook.actions?.map((act, idx) => (
                <div key={idx} className="p-3 rounded bg-muted/40 border border-border/60 text-xs font-mono font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {typeof act === 'string' ? act : JSON.stringify(act)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Test Result Output */}
        {testResult && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="py-3 border-b border-primary/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Synthetic Test Evaluation Result
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Evaluation Status:</span>
                <Badge className={testResult.matched ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                  {testResult.matched ? 'MATCHED' : 'NO MATCH'}
                </Badge>
              </div>
              <pre className="p-2 rounded bg-background border border-border text-[11px] overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
