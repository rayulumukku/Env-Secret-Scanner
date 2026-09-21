'use client';

/**
 * app/trust/ai/page.js
 *
 * AI Privacy & Data Handling Center.
 * Factual visibility into deterministic local processing, zero-code-training guarantees,
 * secret redaction pre-flight, and optional AI provider configuration.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  EyeOff,
  Server,
  RefreshCw,
  Zap,
  Sliders,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function AIPrivacyCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAISettings();
  }, []);

  async function fetchAISettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/ai');
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

  async function toggleAI(enabled) {
    try {
      setUpdating(true);
      const res = await fetch('/api/trust/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiEnabled: enabled }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({ ...prev, settings: json.data.settings }));
      }
    } catch {
      // fallback
    } finally {
      setUpdating(false);
    }
  }

  const settings = data?.settings || {
    aiEnabled: false,
    configuredProvider: 'None (Pure Deterministic Engine)',
    allowedRoles: ['ADMIN', 'SECURITY_OFFICER'],
    dataMinimization: 'STRICT',
    secretRedactionStatus: 'ACTIVE_PRE_TRANSMISSION',
    requestLimits: '50 req/day per org',
    providerConfigurationStatus: 'OPTIONAL_UNCONFIGURED',
    deterministicFallback: true,
    zeroTrainingAgreement: true,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/5 text-xs">
            Command 22 Integrated
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Zero-Secret Transmission Protocol</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Cpu className="w-8 h-8 text-amber-400" />
              AI Privacy & Code Protection Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Understand how SecretShield isolates source code, guarantees zero third-party model training,
              masks secrets in volatile memory, and enforces deterministic offline scanning.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAISettings}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <TrustNav />

      {/* Primary Privacy Notice Alert */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Deterministic First-Party Architecture
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Core secret detection in SecretShield is <strong>100% deterministic</strong>, using local regex pattern
            matching, Shannon entropy calculations, and contextual false-positive heuristics. AI features are
            completely optional and disabled by default.
          </p>
        </div>
      </div>

      {/* AI Controls Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toggle & Provider Status */}
        <Card className="border-border/60 bg-card/40 md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              AI Service Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
              <div>
                <div className="font-semibold text-foreground">AI Triage Assistance</div>
                <div className="text-[11px] text-muted-foreground">Optional generative explanation</div>
              </div>
              <Button
                size="sm"
                variant={settings.aiEnabled ? 'default' : 'outline'}
                className="text-xs"
                onClick={() => toggleAI(!settings.aiEnabled)}
                disabled={updating}
              >
                {settings.aiEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground">Configured Provider:</div>
              <div className="p-2.5 rounded bg-muted/40 font-mono text-foreground font-semibold">
                {settings.configuredProvider}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground">Deterministic Fallback:</div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
                Always Active (100% Coverage)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground">Usage Quota:</div>
              <div className="font-mono text-foreground">{settings.requestLimits}</div>
            </div>
          </CardContent>
        </Card>

        {/* Core Guarantees & Safeguards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-foreground">Pre-Transmission Redaction</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an AI explanation is triggered, all potential credentials, authorization headers, and high-entropy
              tokens are replaced with <code>[REDACTED_SECRET_FINGERPRINT]</code> in memory prior to transmission.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-foreground">Zero Model Training</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SecretShield operates under strict zero-retention enterprise API terms. No customer source code, diffs,
              or finding metadata is ever retained or used to train third-party machine learning models.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-foreground">Data Minimization</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payloads transmitted to helper engines are limited to localized syntax context surrounding the detection
              rule match (max 10 surrounding lines), stripping repository identifiers and commit authors.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-foreground">Role-Based AI Access</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Only authorized administrative roles (<code>ADMIN</code>, <code>SECURITY_OFFICER</code>) can invoke AI
              triage helpers. Read-only viewers and standard contributors have AI invocation restricted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
