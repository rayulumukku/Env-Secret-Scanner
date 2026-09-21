'use client';

/**
 * app/trust/vendors/page.js
 *
 * Vendor & Integration Security Center for SecretShield Trust Center.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function VendorsTrustPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations');
      const json = await res.json();
      if (json.success) {
        setIntegrations(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/trust" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Trust Center
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Third-Party Vendor & Integration Security</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Factual security postures, requested OAuth scopes, webhook signatures, and data boundaries for connected services.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/integrations">
                <Button size="sm" className="gap-2">
                  <Server className="w-4 h-4" />
                  Manage Connections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Core Integration Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="p-1.5 rounded-md bg-muted border border-border">GitHub</span>
                  GitHub App / OAuth
                </CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permission Scopes:</span>
                <span className="font-mono text-foreground">repo (read:commit, read:diff), pull_request</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook Verification:</span>
                <span className="text-emerald-400 font-mono">HMAC-SHA256 Signed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Storage:</span>
                <span className="text-foreground">In-Memory Session Token (Zero Plaintext DB)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="p-1.5 rounded-md bg-muted border border-border">GitLab</span>
                  GitLab Webhook & Token
                </CardTitle>
                <Badge variant="outline">Configurable</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permission Scopes:</span>
                <span className="font-mono text-foreground">read_repository, read_api</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook Verification:</span>
                <span className="text-emerald-400 font-mono">Secret Token Header Guard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Storage:</span>
                <span className="text-foreground">Salted Encrypted Vault</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
