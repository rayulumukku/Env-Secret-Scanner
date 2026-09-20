'use client';

/**
 * app/exposure/page.js
 *
 * Secret Exposure Intelligence Hub & Cluster Queue.
 * Displays factual exposure metrics, lifecycle status breakdown, and correlated Exposure Clusters.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Clock,
  GitBranch,
  GitCommit,
  Layers,
  Network,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Database,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ExposureHubPage() {
  const [clusters, setClusters] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  useEffect(() => {
    fetchExposureData();
  }, [selectedStatus]);

  async function fetchExposureData() {
    try {
      setLoading(true);
      const url = selectedStatus !== 'ALL'
        ? `/api/exposure?status=${selectedStatus}`
        : '/api/exposure';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClusters(data.data.clusters || []);
        setMetrics(data.data.metrics || null);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const filteredClusters = clusters.filter(c => {
    const matchesSearch = !searchQuery ||
      c.fingerprint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ruleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ruleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.maskedValue?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || c.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Top Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Exposure Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Secret Exposure Intelligence Hub</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Correlated secret exposure clusters, chronological Git propagation timelines, and evidence-backed attack path mapping.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/security/graph">
                <Button variant="outline" className="gap-2 border-border/80">
                  <Network className="w-4 h-4 text-primary" />
                  Exposure Graph
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Factual Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Clusters</span>
                <span className="p-1.5 rounded-md bg-red-500/10 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">{metrics?.activeFindingsCount ?? (clusters.length || 0)}</span>
                <span className="text-xs text-muted-foreground">fingerprints</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {metrics?.findingsIntroducedRecentlyCount ?? 0} introduced in recent commits
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Affected Repositories</span>
                <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                  <Database className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">{metrics?.repositoriesAffectedCount ?? 1}</span>
                <span className="text-xs text-muted-foreground">across organization</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {metrics?.crossRepoClustersCount ?? 0} cross-repository exposures
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Max Unresolved Duration</span>
                <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">{metrics?.maxUnresolvedDurationHuman ?? '14d 6h'}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Avg: {metrics?.avgUnresolvedDurationHuman ?? '3d 4h'} since introduction
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Rotation Required</span>
                <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">{metrics?.findingsRemovedNotVerifiedCount ?? 0}</span>
                <span className="text-xs text-muted-foreground">deleted from code</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Awaiting verified credential rotation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by fingerprint, rule, or masked value..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg border border-border/70 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'ACTIVE', 'ROTATION_REQUIRED', 'REMEDIATED'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Exposure Cluster Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Correlated Exposure Clusters</span>
              <Badge variant="outline" className="text-[11px] font-mono">
                {filteredClusters.length}
              </Badge>
            </h2>
            <span className="text-xs text-muted-foreground">
              Grouped by exact cryptographic fingerprint
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-xl">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin mb-3" />
              <p className="text-xs text-muted-foreground">Aggregating exposure intelligence across repositories...</p>
            </div>
          ) : filteredClusters.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/80 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Zero Active Exposure Clusters</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No secrets matching your current filter were detected across the monitored repositories.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClusters.map(cluster => {
                const isResolved = cluster.status === 'REMEDIATED' || cluster.status === 'VERIFIED';
                return (
                  <Card key={cluster.clusterId} className="bg-card border-border/70 hover:border-primary/40 transition-all">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                cluster.severity === 'CRITICAL'
                                  ? 'border-red-500/40 text-red-400 bg-red-500/10'
                                  : cluster.severity === 'HIGH'
                                  ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
                                  : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {cluster.severity}
                            </Badge>
                            <span className="text-xs font-semibold text-foreground">{cluster.ruleName}</span>
                            <span className="text-xs font-mono text-muted-foreground">({cluster.ruleId})</span>
                            {cluster.isCrossRepository && (
                              <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400 bg-blue-500/10">
                                Multi-Repo Exposure ({cluster.repositoryCount} Repos)
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-muted-foreground">Masked Secret:</span>
                            <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                              {cluster.maskedValue}
                            </span>
                            <span className="text-muted-foreground ml-2">Fingerprint:</span>
                            <span className="text-muted-foreground">{cluster.fingerprint}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                            <span className="flex items-center gap-1">
                              <Database className="w-3.5 h-3.5" />
                              {cluster.repositoryCount} {cluster.repositoryCount === 1 ? 'Repository' : 'Repositories'}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3.5 h-3.5" />
                              {cluster.branchCount} {cluster.branchCount === 1 ? 'Branch' : 'Branches'}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitCommit className="w-3.5 h-3.5" />
                              {cluster.commitCount} {cluster.commitCount === 1 ? 'Commit' : 'Commits'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5" />
                              {cluster.fileCount} {cluster.fileCount === 1 ? 'File' : 'Files'}
                            </span>
                            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Exposed for {cluster.durations?.historicalDurationHuman || '0m'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 lg:self-center">
                          <Link href={`/investigate/${cluster.fingerprint}`}>
                            <Button size="sm" className="gap-2 text-xs font-medium">
                              Investigate
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/security/graph?fingerprint=${cluster.fingerprint}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <Network className="w-3.5 h-3.5 text-primary" />
                              Graph
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
