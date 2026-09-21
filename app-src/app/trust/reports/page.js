'use client';

/**
 * app/trust/reports/page.js
 *
 * Trust & Compliance Reports Center.
 * Browse, export, share, and verify evidence-backed security reports in PDF/HTML, JSON, and CSV.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Shield,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function TrustReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/reports');
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/5 text-xs">
            Export & Auditing
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Sanitized Security Evidence Reports</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="w-8 h-8 text-cyan-400" />
              Trust & Compliance Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Export and share standardized, evidence-backed security packets, customer questionnaire summaries,
              and access review reports without exposing raw secrets or internal tokens.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/trust/reports/new">
              <Button size="sm" variant="default" className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Generate New Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <TrustNav />

      {/* Disclaimers & Advice Alert */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Report Limitation Notice
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All generated reports represent factual technical control assessments and verified evidence snapshots
            collected within SecretShield. They do not constitute official SOC 2, ISO 27001, or external third-party
            certifications unless authoritative certification artifacts are linked.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Generated Compliance Reports ({reports.length})</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchReports}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>No compliance reports generated yet.</div>
              <Link href="/trust/reports/new">
                <Button size="sm" variant="outline" className="text-xs">
                  Generate Your First Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {reports.map((rep, idx) => (
                <div key={rep.id || idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">{rep.title}</span>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {rep.format || 'HTML'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {rep.reportType}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Scope: {rep.scope} • Generated by: {rep.generatedBy} •{' '}
                      {new Date(rep.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rep.shareableSlug && (
                      <Link href={`/api/trust/reports/${rep.shareableSlug}`} target="_blank">
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          View Output
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
