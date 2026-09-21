'use client';

/**
 * app/trust/dashboard/page.js
 *
 * Factual Security & Compliance Dashboard for SecretShield Trust Center.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Lock,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TrustDashboardPage() {
  const [controls, setControls] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [ctrlRes, evRes] = await Promise.all([
        fetch('/api/trust/controls'),
        fetch('/api/trust/evidence'),
      ]);
      const ctrlData = await ctrlRes.json();
      const evData = await evRes.json();

      if (ctrlData.success) setControls(ctrlData.data || []);
      if (evData.success) setEvidenceList(evData.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const implemented = controls.filter(c => c.implementationStatus === 'IMPLEMENTED').length;
  const partial = controls.filter(c => c.implementationStatus === 'PARTIALLY_IMPLEMENTED').length;
  const planned = controls.filter(c => c.implementationStatus === 'PLANNED').length;
  const publicControls = controls.filter(c => c.isPublic).length;

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Evidence Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Real-time factual status of documented security controls, evidence validity, and governance reviews.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={loadDashboardData} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Link href="/trust/reports/new">
                <Button size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Audit Package
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Controls Implemented
              </span>
              <p className="text-2xl font-bold text-emerald-400">{implemented}</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Partial / In Progress
              </span>
              <p className="text-2xl font-bold text-amber-400">{partial + planned}</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                Evidence Records
              </span>
              <p className="text-2xl font-bold">{evidenceList.length}</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-400" />
                Publicly Disclosed
              </span>
              <p className="text-2xl font-bold">{publicControls}</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <CardTitle className="text-base font-semibold">
              Control Categories & Implementation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {controls.map((ctrl) => (
              <div key={ctrl.id} className="p-4 hover:bg-muted/10 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{ctrl.code}</span>
                    <span className="text-sm font-medium">{ctrl.name}</span>
                    <Badge className={ctrl.implementationStatus === 'IMPLEMENTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                      {ctrl.implementationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ctrl.description}</p>
                  <div className="text-[11px] text-muted-foreground flex gap-4 pt-1">
                    <span>Category: <span className="font-mono text-foreground">{ctrl.category}</span></span>
                    <span>Owner: <span className="text-foreground">{ctrl.owner}</span></span>
                    <span>Evidence Attached: <span className="font-mono text-foreground">{ctrl.evidence?.length || 0}</span></span>
                  </div>
                </div>

                <Link href={`/trust/controls#${ctrl.code}`}>
                  <Button variant="outline" size="sm">Inspect</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
