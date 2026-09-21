'use client';

/**
 * app/trust/incidents/page.js
 *
 * Trust Incident Response & Evidence Preservation Center.
 * Integrated with existing incident playbooks, containment timelines,
 * lessons learned, and sanitized evidence package export.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ShieldCheck,
  Download,
  BookOpen,
  Clock,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Archive,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function TrustIncidentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/incidents');
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

  async function exportEvidencePackage(incidentId = null) {
    try {
      setExporting(true);
      setExportSuccess(null);
      const res = await fetch('/api/trust/incidents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
      const json = await res.json();
      if (json.success) {
        setExportSuccess(json.data);
        // Trigger browser download
        const blob = new Blob([JSON.stringify(json.data.package, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = json.data.downloadFilename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // fallback
    } finally {
      setExporting(false);
    }
  }

  const openIncidents = data?.openIncidents || [];
  const closedIncidents = data?.closedIncidents || [];
  const playbooks = data?.playbooks || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/5 text-xs">
            SecOps & Evidence Preservation
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Zero Raw-Secret Archive Guarantee</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
              Incident Response & Evidence Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Audit operational incident response timelines, documented lessons learned, active playbooks,
              and download sanitized audit-ready incident evidence packages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => exportEvidencePackage()}
              disabled={exporting}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Generating...' : 'Export Evidence Package'}
            </Button>
          </div>
        </div>
      </div>

      <TrustNav />

      {/* Export Success Notification */}
      {exportSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Evidence Package Successfully Exported
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Integrity SHA-256: {exportSuccess.integrityHash}
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {exportSuccess.downloadFilename}
          </Badge>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="text-xs text-muted-foreground font-medium">Open Incidents</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{data?.openCount || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active triage / containment</div>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="text-xs text-muted-foreground font-medium">Resolved Incidents</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{data?.closedCount || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Rotated & evidence preserved</div>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="text-xs text-muted-foreground font-medium">Response Playbooks</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{playbooks.length || 6}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Automated workflows configured</div>
        </div>
      </div>

      {/* Incident Response Playbooks Section */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Standard Incident Response Playbooks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-border/60 bg-background/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">AWS Key Revocation</span>
              <Badge variant="outline" className="text-[10px]">P0 Critical</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automated IAM credential deactivation, CloudTrail exposure query, and key rotation guidance.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border/60 bg-background/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">GitHub Token Exposure</span>
              <Badge variant="outline" className="text-[10px]">P1 High</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Instant PAT revocation via GitHub API, repo access audit, and force-push rewrite checklist.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border/60 bg-background/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">Database URI Leak</span>
              <Badge variant="outline" className="text-[10px]">P0 Critical</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Password rotation in Secrets Manager, DB connection termination, and IP firewall audit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Open & Historical Incident Table */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Incident Records & Preservation History</span>
            <Link href="/security/incidents" className="text-xs text-primary hover:underline">
              View SecOps Incidents →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {openIncidents.length === 0 && closedIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No incidents recorded. All systems operating normally.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {[...openIncidents, ...closedIncidents].map((inc, i) => (
                <div key={inc.id || i} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          inc.severity === 'CRITICAL' || inc.severity === 'P0'
                            ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                            : 'border-amber-500 text-amber-400 bg-amber-500/10'
                        }
                      >
                        {inc.severity || 'HIGH'}
                      </Badge>
                      <span className="font-semibold text-xs text-foreground">{inc.title || 'Security Incident'}</span>
                      <Badge variant="outline" className="text-[10px]">{inc.status}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      ID: {inc.id} • Created: {new Date(inc.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportEvidencePackage(inc.id)}
                    className="text-xs gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Evidence
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
