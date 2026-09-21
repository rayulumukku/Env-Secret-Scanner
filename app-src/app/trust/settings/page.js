'use client';

/**
 * app/trust/settings/page.js
 *
 * Enterprise Trust Center Configuration & Review Interval Settings.
 * Manage public trust center publishing, review cadences, and security contact details.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Shield,
  CheckCircle2,
  RefreshCw,
  Globe,
  Lock,
  ExternalLink,
  Calendar,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function TrustSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.data.settings);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      const res = await fetch('/api/trust/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (json.success) {
        setSettings(json.data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMsg(json.error || 'Failed to update settings');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <TrustNav />
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
          Loading trust center configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs">
            Administration & Intervals
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Governance Configurations</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Settings className="w-8 h-8 text-primary" />
              Trust Center Settings & Review Intervals
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Configure organizational review intervals, enable optional public Trust Center mode, and manage
              responsible security contact channels.
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={handleSaveSettings}
            disabled={saving}
            className="text-xs"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <TrustNav />

      {saveSuccess && (
        <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Trust center settings successfully updated.
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Trust Center Publishing */}
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Public Trust Center Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
              <div>
                <div className="font-semibold text-foreground">Publish Public Trust Center</div>
                <div className="text-[11px] text-muted-foreground">
                  Allow customers to view whitelisted public controls
                </div>
              </div>
              <Button
                size="sm"
                variant={settings?.publicCenterEnabled ? 'default' : 'outline'}
                onClick={() =>
                  setSettings({ ...settings, publicCenterEnabled: !settings.publicCenterEnabled })
                }
                className="text-xs"
              >
                {settings?.publicCenterEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Public Organization Slug</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings?.organizationSlug || ''}
                  onChange={e => setSettings({ ...settings, organizationSlug: e.target.value })}
                  className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 font-mono"
                />
                {settings?.organizationSlug && (
                  <Link
                    href={`/trust/public/${settings.organizationSlug}`}
                    target="_blank"
                    className="flex-shrink-0"
                  >
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Public Organization Display Name</label>
              <input
                type="text"
                value={settings?.publicName || ''}
                onChange={e => setSettings({ ...settings, publicName: e.target.value })}
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80"
              />
            </div>
          </CardContent>
        </Card>

        {/* Responsible Security Contact */}
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              Security Contact Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Security Vulnerability Contact Email</label>
              <input
                type="email"
                value={settings?.securityContactEmail || ''}
                onChange={e => setSettings({ ...settings, securityContactEmail: e.target.value })}
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80"
                placeholder="security@yourcompany.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Security Disclosure URL</label>
              <input
                type="url"
                value={settings?.securityContactUrl || ''}
                onChange={e => setSettings({ ...settings, securityContactUrl: e.target.value })}
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80"
                placeholder="https://yourcompany.com/security"
              />
            </div>
          </CardContent>
        </Card>

        {/* Governance Review Intervals */}
        <Card className="border-border/60 bg-card/40 md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Configurable Review Cadence (Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Access Reviews</label>
              <input
                type="number"
                value={settings?.accessReviewIntervalDays || 90}
                onChange={e =>
                  setSettings({ ...settings, accessReviewIntervalDays: Number(e.target.value) })
                }
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Standard: 90 days (Quarterly)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Policy Reviews</label>
              <input
                type="number"
                value={settings?.policyReviewIntervalDays || 365}
                onChange={e =>
                  setSettings({ ...settings, policyReviewIntervalDays: Number(e.target.value) })
                }
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Standard: 365 days (Annual)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Security Testing</label>
              <input
                type="number"
                value={settings?.securityTestIntervalDays || 30}
                onChange={e =>
                  setSettings({ ...settings, securityTestIntervalDays: Number(e.target.value) })
                }
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Standard: 30 days (Monthly)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium">Integration Auditing</label>
              <input
                type="number"
                value={settings?.integrationReviewDays || 90}
                onChange={e =>
                  setSettings({ ...settings, integrationReviewDays: Number(e.target.value) })
                }
                className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Standard: 90 days (Quarterly)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
