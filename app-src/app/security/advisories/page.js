'use client';

/**
 * app/security/advisories/page.js
 *
 * SecretShield Product Security Advisories.
 * Official disclosures, vulnerability bulletins, affected versions, and mitigation guidance.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Lock,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityAdvisoriesPage() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvisories();
  }, []);

  async function fetchAdvisories() {
    try {
      setLoading(true);
      const res = await fetch('/api/security/advisories');
      const json = await res.json();
      if (json.success) {
        setAdvisories(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const getSeverityBadge = sev => {
    switch (sev) {
      case 'CRITICAL':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px]">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-[10px]">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">MEDIUM</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">LOW</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/security" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Security Command Center
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldAlert className="w-8 h-8 text-orange-400" />
              SecretShield Security Advisories
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Official vulnerability bulletins, affected package versions, remediation steps, and product security
              notices.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAdvisories}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advisory Principles Alert */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Responsible Vulnerability Disclosure
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All advisories published here represent verified security fixes. SecretShield does not fabricate CVEs or
            third-party identifiers. For reporting new vulnerabilities, consult our{' '}
            <Link href="/security/disclosure" className="text-primary hover:underline">
              Responsible Disclosure Policy
            </Link>.
          </p>
        </div>
      </div>

      {/* Advisories List */}
      <div className="space-y-4">
        {advisories.length === 0 ? (
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-8 text-center text-xs text-muted-foreground">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No open or historical security advisories found.
            </CardContent>
          </Card>
        ) : (
          advisories.map((adv, idx) => (
            <Card key={adv.id || idx} className="border-border/60 bg-card/40 hover:border-border transition-colors">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{adv.advisoryId}</span>
                    <CardTitle className="text-base font-bold text-foreground">{adv.title}</CardTitle>
                    {getSeverityBadge(adv.severity)}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Published: {new Date(adv.publishedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <p className="text-muted-foreground leading-relaxed">{adv.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-background/50 border border-border/40">
                  <div>
                    <span className="text-muted-foreground font-medium">Affected Versions: </span>
                    <span className="font-mono text-rose-400 font-semibold">{adv.affectedVersion}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Fixed Version: </span>
                    <span className="font-mono text-emerald-400 font-semibold">{adv.fixedVersion}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Impact:</span>
                  <p className="text-muted-foreground">{adv.impact}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Mitigation / Action Required:</span>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                    {adv.mitigation}
                  </div>
                </div>

                {adv.references && adv.references.length > 0 && (
                  <div className="pt-2 border-t border-border/30 flex flex-wrap gap-2 text-[11px]">
                    <span className="text-muted-foreground">References:</span>
                    {adv.references.map((ref, rIdx) => (
                      <span key={rIdx} className="text-primary font-mono hover:underline">
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
