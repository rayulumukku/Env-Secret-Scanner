'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllowlist, useCustomRules } from '@/lib/hooks/useCustomRules';
import { useScanHistory } from '@/lib/hooks/useScanHistory';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings, Shield, Trash2, EyeOff, SlidersHorizontal,
  Info, AlertTriangle, RotateCcw, CheckCircle2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SLIDER_SETTINGS = [
  {
    key: 'entropyThreshold',
    label: 'Entropy Threshold',
    desc: 'Minimum Shannon entropy for high-entropy string detection. Higher = fewer false positives.',
    min: 3.0,
    max: 6.0,
    step: 0.1,
    default: 4.5,
  },
  {
    key: 'minSecretLength',
    label: 'Minimum Secret Length',
    desc: 'Minimum character length to flag a string as a potential secret.',
    min: 8,
    max: 32,
    step: 1,
    default: 16,
  },
];

const TOGGLE_SETTINGS = [
  { key: 'detectGeneric', label: 'Generic Secret Detection', desc: 'Detect password assignments, generic API keys, bearer tokens' },
  { key: 'detectHighEntropy', label: 'High Entropy Detection', desc: 'Flag high-entropy strings even without a known prefix' },
  { key: 'detectJWT', label: 'JWT Detection', desc: 'Flag hardcoded JSON Web Tokens' },
];

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? 'Disable' : 'Enable'}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
        enabled ? 'bg-primary' : 'bg-secondary border border-border/60'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
        enabled ? 'translate-x-4' : 'translate-x-0.5'
      )} />
    </button>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { clearHistory } = useScanHistory();
  const { clearAllowlist, allowlist } = useAllowlist();
  const { rules, deleteRule } = useCustomRules();

  const [scanSettings, setScanSettings] = useLocalStorage('secretshield_settings', {
    entropyThreshold: 4.5,
    minSecretLength: 16,
    detectGeneric: true,
    detectHighEntropy: true,
    detectJWT: true,
  });

  const [confirmAction, setConfirmAction] = useState(null);

  const updateSetting = (key, val) => {
    setScanSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleClearHistory = () => {
    if (confirmAction !== 'history') { setConfirmAction('history'); return; }
    clearHistory();
    setConfirmAction(null);
    toast({ title: 'History cleared', description: 'All scan history has been deleted.' });
  };

  const handleClearAllowlist = () => {
    if (confirmAction !== 'allowlist') { setConfirmAction('allowlist'); return; }
    clearAllowlist();
    setConfirmAction(null);
    toast({ title: 'Allowlist cleared', description: 'All allowlisted entries removed.' });
  };

  const handleResetSettings = () => {
    if (confirmAction !== 'settings') { setConfirmAction('settings'); return; }
    setScanSettings({
      entropyThreshold: 4.5,
      minSecretLength: 16,
      detectGeneric: true,
      detectHighEntropy: true,
      detectJWT: true,
    });
    setConfirmAction(null);
    toast({ title: 'Settings reset', description: 'All settings restored to defaults.' });
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Scanner settings */}
          <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Scanner Settings</h2>
            </div>
            <div className="p-5 space-y-6">
              {/* Sliders */}
              {SLIDER_SETTINGS.map(s => (
                <div key={s.key}>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm font-medium">{s.label}</label>
                    <span className="text-sm font-mono text-primary">
                      {(scanSettings?.[s.key] ?? s.default).toFixed(s.step < 1 ? 1 : 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={scanSettings?.[s.key] ?? s.default}
                    onChange={e => updateSetting(s.key, parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
                    <span>{s.min}</span><span>{s.max}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{s.desc}</p>
                </div>
              ))}

              {/* Toggles */}
              {TOGGLE_SETTINGS.map(s => (
                <div key={s.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                  <ToggleSwitch
                    enabled={scanSettings?.[s.key] ?? true}
                    onToggle={() => updateSetting(s.key, !(scanSettings?.[s.key] ?? true))}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Allowlist */}
          <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Allowlist</h2>
              <Badge variant="outline" className="text-[10px] ml-auto border-border/30 text-muted-foreground">
                {(allowlist?.fingerprints?.length ?? 0)} fingerprints · {(allowlist?.files?.length ?? 0)} files
              </Badge>
            </div>
            <div className="p-5 space-y-3">
              {allowlist?.fingerprints?.length > 0 ? (
                <div className="space-y-1.5">
                  {allowlist.fingerprints.map(fp => (
                    <div key={fp} className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded">
                      <span className="flex-1 truncate">{fp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No allowlisted entries. Mark findings as false positives to add them here.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllowlist}
                className={cn(
                  'gap-1.5 text-xs border-border/50',
                  confirmAction === 'allowlist' && 'border-red-900/50 text-red-400'
                )}
                disabled={(allowlist?.fingerprints?.length ?? 0) === 0}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmAction === 'allowlist' ? 'Click again to confirm' : 'Clear Allowlist'}
              </Button>
            </div>
          </section>

          {/* Data management */}
          <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Data Management</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Scan History</p>
                  <p className="text-xs text-muted-foreground">Delete all locally stored scan history</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className={cn('gap-1.5 text-xs border-border/50', confirmAction === 'history' && 'border-red-900/50 text-red-400')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmAction === 'history' ? 'Confirm' : 'Clear History'}
                </Button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Reset All Settings</p>
                  <p className="text-xs text-muted-foreground">Restore all scanner settings to defaults</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSettings}
                  className={cn('gap-1.5 text-xs border-border/50', confirmAction === 'settings' && 'border-red-900/50 text-red-400')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {confirmAction === 'settings' ? 'Confirm' : 'Reset'}
                </Button>
              </div>
            </div>
          </section>

          {/* Privacy note */}
          <div className="rounded-lg border border-border/30 bg-card/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              All settings, history, and allowlists are stored only in your browser's localStorage.
              Nothing is ever sent to a server.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
