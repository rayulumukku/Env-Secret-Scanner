'use client';

/**
 * app/settings/notifications/page.js
 *
 * Notification Channels & Alert Preferences.
 */

import React, { useState } from 'react';
import { Bell, ShieldAlert, AlertTriangle, GitBranch, Save, Check } from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    criticalFindings: true,
    highFindings: true,
    scanFailures: true,
    repoEvents: false,
    dailyDigest: true,
  });
  const [saving, setSaving] = useState(false);

  const togglePref = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast({
      title: 'Preferences Saved',
      description: 'Your security notification preferences have been updated.',
    });
  };

  const items = [
    {
      key: 'criticalFindings',
      title: 'Critical Severity Findings',
      description: 'Immediate alerts when AWS, GitHub, or database credentials are detected',
      icon: ShieldAlert,
      color: 'text-red-400',
    },
    {
      key: 'highFindings',
      title: 'High Severity Findings',
      description: 'Alerts for generic high-entropy tokens and private key fragments',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      key: 'scanFailures',
      title: 'Scan & Pipeline Failures',
      description: 'Notify when repository scans or PR check runs encounter processing errors',
      icon: Bell,
      color: 'text-primary',
    },
    {
      key: 'repoEvents',
      title: 'Repository Connection Events',
      description: 'Notifications when new branches or repositories are connected',
      icon: GitBranch,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2.5 mb-2">
        <Bell className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Select which security events trigger email and webhook alerts.
      </p>

      <SettingsNav />

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/40 overflow-hidden">
          {items.map(item => {
            const Icon = item.icon;
            const enabled = preferences[item.key];

            return (
              <div
                key={item.key}
                onClick={() => togglePref(item.key)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-xl bg-secondary ${item.color} mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 flex-shrink-0 ${
                    enabled ? 'bg-primary justify-end' : 'bg-secondary border border-border/60 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
