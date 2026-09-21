'use client';

/**
 * app/trust/public/[orgSlug]/page.js
 *
 * Public Trust Center View for customer security evaluation.
 * Displays only explicitly authorized public controls and factual security posture.
 * Strictly guarantees ZERO leakage of private findings, tokens, repository names, or internal members.
 */

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck,
  Server,
  Layers,
  Cpu,
  Clock,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PublicTrustCenterPage({ params }) {
  const unwrappedParams = use(params);
  const orgSlug = unwrappedParams.orgSlug;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProfile();
  }, [orgSlug]);

  async function fetchPublicProfile() {
    try {
      setLoading(true);
      const res = await fetch(`/api/trust/public/${orgSlug}`);
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const controls = profile?.controls || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Banner */}
      <div className="border-b border-border/40 bg-muted/20 py-3 px-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>
          Public Trust & Security Posture for <strong>{profile?.organizationName || orgSlug}</strong> — Verified by SecretShield Engine
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs">
            Customer Security Portal
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {profile?.organizationName || orgSlug.toUpperCase()} Security & Trust Center
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Real-time, factual visibility into technical security controls, data encryption architecture,
            and continuous code protection standards.
          </p>
        </div>

        {/* Factual Disclaimer Alert */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
          <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Factual Control Assertions Notice
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile?.disclaimer ||
                'Controls displayed are documented organizational assertions verified by SecretShield technical scans and automated checks. This page does not constitute third-party legal or compliance certifications unless formal certification documents are attached.'}
            </p>
          </div>
        </div>

        {/* Security Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">In-Memory Secret Masking</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Detected secrets are masked into 8-character fingerprints in volatile memory. Raw credentials are never
              stored.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-foreground">Zero Cloud Model Training</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Core secret scanning runs 100% deterministically offline. Proprietary source code is never used for AI
              training.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-foreground">Data Encryption Standard</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              All stored findings and audit hashes are protected with AES-256-GCM encryption at rest and TLS 1.3 in
              transit.
            </p>
          </div>
        </div>

        {/* Published Public Controls Catalog */}
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Verified Technical Security Controls ({controls.length})</span>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-xs">
                Active Controls
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {controls.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No public controls published yet by organization administrators.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {controls.map(c => (
                  <div key={c.code} className="p-4 space-y-1.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{c.code}</span>
                        <span className="font-semibold text-xs text-foreground">{c.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.implementationStatus === 'IMPLEMENTED'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px]'
                            : 'border-amber-500/40 text-amber-400 bg-amber-500/5 text-[10px]'
                        }
                      >
                        {c.implementationStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1">
                      <span>Category: {c.category}</span>
                      <span>Scope: {c.scope || 'Organization Wide'}</span>
                      {c.lastReviewedAt && (
                        <span>Last Reviewed: {new Date(c.lastReviewedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsible Security Contact Footer */}
        <div className="p-6 rounded-xl border border-border/60 bg-muted/20 text-center space-y-2 text-xs">
          <div className="font-semibold text-foreground">Need security verification or a customer questionnaire?</div>
          <p className="text-muted-foreground">
            Contact the security team directly or submit a vendor assessment request.
          </p>
          <div className="pt-2">
            <Link href="/security/disclosure">
              <Button size="sm" variant="outline" className="text-xs">
                View Responsible Vulnerability Disclosure Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
