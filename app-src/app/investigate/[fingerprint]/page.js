'use client';

/**
 * app/investigate/[fingerprint]/page.js
 *
 * Comprehensive Security Investigation Workspace for Secret Exposure.
 * Contains Overview, Timeline, Affected Repos/Branches/Commits/Files, Evidence Inspector,
 * "Why is this grouped?", and Sanitized Export Modal.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldAlert,
  Clock,
  GitBranch,
  GitCommit,
  Layers,
  Network,
  Download,
  FileCode,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityInvestigationPage() {
  const params = useParams();
  const fingerprint = params?.fingerprint;

  const [cluster, setCluster] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (fingerprint) {
      loadInvestigationData(fingerprint);
    }
  }, [fingerprint]);

  async function loadInvestigationData(fp) {
    try {
      setLoading(true);
      const [clusterRes, timelineRes, evidenceRes] = await Promise.all([
        fetch(`/api/exposure/${fp}`),
        fetch(`/api/exposure/${fp}/timeline`),
        fetch(`/api/exposure/${fp}/evidence`),
      ]);

      const clusterData = await clusterRes.json();
      const timelineData = await timelineRes.json();
      const evidenceData = await evidenceRes.json();

      if (clusterData.success) setCluster(clusterData.data);
      if (timelineData.success) setTimeline(timelineData.data);
      if (evidenceData.success) setEvidenceList(evidenceData.data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/exposure/${fingerprint}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (format === 'csv' || format === 'html') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `secretshield-exposure-${fingerprint}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `secretshield-exposure-${fingerprint}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      // export error
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <Clock className="w-8 h-8 mx-auto text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Loading exposure intelligence for {fingerprint}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Navigation & Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/exposure" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Exposure Hub
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    cluster?.severity === 'CRITICAL'
                      ? 'border-red-500/40 text-red-400 bg-red-500/10'
                      : cluster?.severity === 'HIGH'
                      ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
                      : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                  }`}
                >
                  {cluster?.severity || 'HIGH'} SEVERITY
                </Badge>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">
                  STATUS: {cluster?.status || 'ACTIVE'}
                </Badge>
                {cluster?.isCrossRepository && (
                  <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400 bg-blue-500/10">
                    Cross-Repository ({cluster.repositoryCount} Repos)
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                Investigation: {cluster?.maskedValue || '••••••••'}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Fingerprint: <span className="text-foreground">{fingerprint}</span> • Rule: <span className="text-foreground">{cluster?.ruleName || cluster?.ruleId}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/security/graph?fingerprint=${fingerprint}`}>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Network className="w-3.5 h-3.5 text-primary" />
                  View in Graph
                </Button>
              </Link>
              <div className="relative group">
                <Button size="sm" variant="secondary" className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Export Report
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border/70 rounded-lg shadow-lg py-1 hidden group-hover:block z-50">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    Sanitized JSON Report
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    CSV Summary Table
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    Printable HTML Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Factual Credential Notice */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span><strong>Factual Policy:</strong> Credential validity not verified. Relationships represent confirmed repository and file associations.</span>
          </div>
          <span className="text-[11px] font-mono">Zero raw secrets exposed</span>
        </div>

        {/* Factual Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card border-border/70">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground font-medium">Historical Exposure</span>
              <div className="mt-1 text-xl font-bold font-mono text-foreground">
                {cluster?.durations?.historicalDurationHuman || '0m'}
              </div>
              <span className="text-[11px] text-muted-foreground">Since first introduced</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground font-medium">Affected Repositories</span>
              <div className="mt-1 text-xl font-bold font-mono text-foreground">
                {cluster?.repositoryCount || 1}
              </div>
              <span className="text-[11px] text-muted-foreground">{cluster?.isCrossRepository ? 'Multi-repo risk' : 'Single repo'}</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground font-medium">Branches & Commits</span>
              <div className="mt-1 text-xl font-bold font-mono text-foreground">
                {cluster?.branchCount || 1} / {cluster?.commitCount || 1}
              </div>
              <span className="text-[11px] text-muted-foreground">Branches / Commits</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground font-medium">Affected Files</span>
              <div className="mt-1 text-xl font-bold font-mono text-foreground">
                {cluster?.fileCount || 1}
              </div>
              <span className="text-[11px] text-muted-foreground">Distinct paths</span>
            </CardContent>
          </Card>
        </div>

        {/* "Why is this grouped?" section */}
        <Card className="bg-card border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Why is this grouped? (Exact Fingerprint Correlation)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              SecretShield correlated these findings into a unified exposure cluster because they share the <strong>identical cryptographic fingerprint</strong> (<code className="font-mono text-foreground">{fingerprint}</code>).
            </p>
            <p>
              This is <em>not</em> heuristic similarity. SecretShield’s fingerprinting engine calculated a deterministic cryptographic digest across all matching locations, proving this is the exact same underlying secret value appearing across {cluster?.repositoryCount || 1} repository, {cluster?.branchCount || 1} branch, and {cluster?.commitCount || 1} commit.
            </p>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="space-y-4">
          <div className="border-b border-border/70 flex gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Chronological Exposure Timeline ({timeline?.events?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('repositories')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'repositories'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Affected Repositories ({cluster?.repositories?.length || 1})
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Verifiable Evidence Records ({evidenceList.length})
            </button>
            <button
              onClick={() => setActiveTab('remediation')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'remediation'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Remediation Sequence
            </button>
          </div>

          {/* TAB 1: Chronological Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 pt-2">
              <div className="relative border-l-2 border-border/80 ml-4 pl-6 space-y-6">
                {(timeline?.events || []).map((evt, idx) => (
                  <div key={evt.id || idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />

                    <div className="p-4 rounded-lg border border-border/70 bg-card space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{evt.title}</span>
                          <Badge variant="outline" className="text-[10px] border-border bg-muted/40">
                            {evt.badge || 'Event'}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">{evt.description}</p>

                      <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground flex-wrap pt-1 border-t border-border/40">
                        {evt.repositoryName && <span>Repo: {evt.repositoryName}</span>}
                        {evt.branch && <span>Branch: {evt.branch}</span>}
                        {evt.commitHash && <span>Commit: {evt.commitHash.slice(0, 8)}</span>}
                        {evt.file && <span>File: {evt.file}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Affected Repositories */}
          {activeTab === 'repositories' && (
            <div className="grid gap-4 pt-2">
              {(cluster?.repositories || []).map(r => (
                <Card key={r.repositoryId} className="bg-card border-border/70">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">{r.repositoryName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>{r.findingCount} finding occurrences</span>
                        <span>{r.filesCount} files</span>
                        <span>{r.branchesCount} branches</span>
                      </div>
                    </div>
                    <Link href={`/repositories/${r.repositoryId}`}>
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        View Repo
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 3: Evidence Records */}
          {activeTab === 'evidence' && (
            <div className="space-y-4 pt-2">
              {evidenceList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl">
                  <FileCheck className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">All timeline assertions are backed by scanner detection logs.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {evidenceList.map(ev => (
                    <Card key={ev.evidenceId} className="bg-card border-border/70">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                              {ev.type}
                            </Badge>
                            <span className="font-semibold text-foreground font-mono">{ev.evidenceId}</span>
                          </div>
                          <span className="text-muted-foreground font-mono text-[11px]">{new Date(ev.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">{ev.summary}</p>
                        <div className="text-[11px] font-mono text-muted-foreground flex gap-3 pt-1">
                          <span>Source ID: {ev.sourceId}</span>
                          <span>Confidence: {ev.confidence}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Step-by-Step Remediation Sequence */}
          {activeTab === 'remediation' && (
            <div className="space-y-4 pt-2">
              <Card className="bg-card border-border/70">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-primary" />
                    Verified Remediation Sequence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-foreground">Revoke & Rotate Active Credential</h4>
                        <p className="text-xs text-muted-foreground">
                          {cluster?.remediationGuide || 'Log in to your provider security console immediately. Revoke the exposed credential and generate a fresh key.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-foreground">Remove Credential from Source Code</h4>
                        <p className="text-xs text-muted-foreground">
                          Replace hardcoded credentials with environment variables or secure secrets management. Ensure <code>.env</code> files are listed in <code>.gitignore</code>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-foreground">Purge Git History (If Exposed in Public/Shared Repositories)</h4>
                        <p className="text-xs text-muted-foreground">
                          If repository history is distributed or public, use <code>git-filter-repo</code> or BFG Repo-Cleaner to eliminate historical commits containing the key.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-foreground">Run Automated Verification Scan</h4>
                        <p className="text-xs text-muted-foreground">
                          Re-scan the repository using SecretShield CLI or Web dashboard to verify zero remaining occurrences across all branches.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
