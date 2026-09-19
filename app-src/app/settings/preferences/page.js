'use client';

/**
 * app/settings/preferences/page.js
 *
 * User Display & Scanner Preferences.
 */

import React, { useState } from 'react';
import { Sliders, Moon, Sun, Laptop, Shield, Zap, Save } from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [theme, setTheme] = useState('dark');
  const [defaultScanMode, setDefaultScanMode] = useState('CURRENT');
  const [minConfidenceThreshold, setMinConfidenceThreshold] = useState(70);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast({
      title: 'Preferences Saved',
      description: 'Your scanner and UI preferences have been stored.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2.5 mb-2">
        <Sliders className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Customize interface theme, default scan depth, and confidence filters.
      </p>

      <SettingsNav />

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Appearance */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-4">
          <h3 className="font-bold text-sm text-foreground">Interface Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'system', label: 'System', icon: Laptop },
            ].map(t => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl border text-center space-y-1.5 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                  <div className="text-xs font-semibold">{t.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scanner Defaults */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <h3 className="font-bold text-sm text-foreground">Scanner Defaults</h3>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Default Scan Mode
            </label>
            <select
              value={defaultScanMode}
              onChange={e => setDefaultScanMode(e.target.value)}
              className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="CURRENT">Current Tree (Fastest, latest commits)</option>
              <option value="GIT_HISTORY">Full Git History (Deep commit analysis)</option>
              <option value="STAGED">Staged Changes Only (Pre-commit hook)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Minimum Confidence Threshold
              </label>
              <span className="font-mono text-xs text-primary font-bold">{minConfidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={minConfidenceThreshold}
              onChange={e => setMinConfidenceThreshold(parseInt(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Findings below this confidence score will be filtered out to eliminate false positives.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
