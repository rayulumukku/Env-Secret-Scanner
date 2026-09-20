'use client';

/**
 * app/settings/data-retention/page.js
 *
 * Data Retention & Purge Policy Management.
 *
 * SAFETY INVARIANT:
 *   - Never deletes active findings unless explicit confirmed policy is activated.
 *   - Displays clear impact warnings before saving any retention changes.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, ArrowLeft, Save, AlertTriangle, ShieldAlert,
  CheckCircle2, Clock, Trash2, Database, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function DataRetentionPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState({
    scanMetadataDays: 180,
    auditLogsDays: 365,
    webhookDeliveriesDays: 30,
    notificationsDays: 90,
    integrationEventsDays: 90,
    deleteFindingsWithScans: false,
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await fetch('/api/settings/data-retention');
        const data = await res.json();
        if (data.success && data.data) {
          setPolicy(data.data);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/data-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Policy updated', description: 'Data retention schedules have been saved.' });
      } else {
        toast({ title: 'Save failed', description: data.error?.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not reach server.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Data Retention Policies</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure automated lifecycle retention schedules for scan metadata, audit logs, and webhooks.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Retention Rules'}
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-200">Data Lifecycle Policy Protection</div>
            <p className="leading-relaxed">
              SecretShield safeguards your security posture by never automatically purging unresolved findings unless explicitly authorized. Data purged by retention rules cannot be recovered.
            </p>
          </div>
        </div>

        {/* Retention Schedule Form */}
        <div className="space-y-6">
          {/* Scan Metadata */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Scan Execution Records & Metadata</h3>
                <p className="text-xs text-muted-foreground">Retention period for scan logs, run duration, and file counts.</p>
              </div>
              <select
                value={policy.scanMetadataDays}
                onChange={(e) => setPolicy({ ...policy, scanMetadataDays: Number(e.target.value) })}
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={180}>180 Days (Recommended)</option>
                <option value={365}>365 Days (1 Year)</option>
                <option value={0}>Retain Indefinitely</option>
              </select>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Security Audit Trail</h3>
                <p className="text-xs text-muted-foreground">Compliance audit logs for login events, role updates, and baseline modifications.</p>
              </div>
              <select
                value={policy.auditLogsDays}
                onChange={(e) => setPolicy({ ...policy, auditLogsDays: Number(e.target.value) })}
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>365 Days (1 Year - Standard)</option>
                <option value={730}>730 Days (2 Years)</option>
                <option value={0}>Retain Indefinitely</option>
              </select>
            </div>
          </div>

          {/* Webhook Delivery Logs */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Webhook Deliveries & Diagnostics</h3>
                <p className="text-xs text-muted-foreground">HTTP delivery responses, timestamps, and retry attempt records.</p>
              </div>
              <select
                value={policy.webhookDeliveriesDays}
                onChange={(e) => setPolicy({ ...policy, webhookDeliveriesDays: Number(e.target.value) })}
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
              >
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-foreground">In-App Notifications</h3>
                <p className="text-xs text-muted-foreground">Archived notification inbox alerts and read status records.</p>
              </div>
              <select
                value={policy.notificationsDays}
                onChange={(e) => setPolicy({ ...policy, notificationsDays: Number(e.target.value) })}
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days (Recommended)</option>
                <option value={180}>180 Days</option>
              </select>
            </div>
          </div>

          {/* Findings Purge Toggle */}
          <div className="p-5 rounded-xl border border-red-500/30 bg-card/40 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Purge Associated Findings with Aged Scans
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  When enabled, findings discovered exclusively in purged scans will also be permanently deleted. Leave unchecked to preserve historical vulnerability trends and compliance tracking.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.deleteFindingsWithScans}
                onChange={(e) => setPolicy({ ...policy, deleteFindingsWithScans: e.target.checked })}
                className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
