'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, AlertTriangle, CheckCircle2, FolderGit2,
  TrendingUp, Key, Lock, ArrowUpRight, Plus,
  Info, ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [],
    findings: [],
    stats: {
      totalProjects: 0,
      totalRepositories: 0,
      openFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      secretsThisWeek: 0,
      resolvedFindings: 0,
      repositoriesWithIssues: 0,
      healthScore: { score: 100, status: 'EXCELLENT', factors: {} },
    },
  });
  const [showHealthModal, setShowHealthModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [projectsRes, findingsRes] = await Promise.all([
        fetch('/api/organizations/active/projects').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/findings?limit=100').then(r => r.json()).catch(() => ({ data: { findings: [] } })),
      ]);

      const projects = projectsRes.data || [];
      const findings = findingsRes.data?.findings || [];

      // Calculate real metrics
      const openFindings = findings.filter(f => f.status === 'OPEN');
      const criticalFindings = openFindings.filter(f => f.severity === 'CRITICAL').length;
      const highFindings = openFindings.filter(f => f.severity === 'HIGH').length;
      const resolvedFindings = findings.filter(f => ['REMEDIATED', 'FALSE_POSITIVE', 'IGNORED'].includes(f.status)).length;

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const secretsThisWeek = findings.filter(f => new Date(f.createdAt).getTime() > oneWeekAgo).length;

      let totalRepositories = 0;
      let scannedRepositories = 0;
      const reposWithIssues = new Set();

      for (const p of projects) {
        const repos = p.repositories || [];
        totalRepositories += repos.length;
        scannedRepositories += repos.filter(r => r.lastScannedAt).length;
      }
      for (const f of openFindings) {
        if (f.repositoryId) reposWithIssues.add(f.repositoryId);
      }

      // Calculate security health
      let score = 100;
      score -= (criticalFindings * 25);
      score -= (highFindings * 10);
      if (totalRepositories > 0 && scannedRepositories < totalRepositories) {
        score -= 10;
      }
      const clampedScore = Math.max(0, Math.min(100, score));

      let status = 'EXCELLENT';
      if (clampedScore < 40) status = 'CRITICAL RISK';
      else if (clampedScore < 70) status = 'NEEDS ATTENTION';
      else if (clampedScore < 85) status = 'GOOD';

      setData({
        projects,
        findings,
        stats: {
          totalProjects: projects.length,
          totalRepositories,
          openFindings: openFindings.length,
          criticalFindings,
          highFindings,
          secretsThisWeek,
          resolvedFindings,
          repositoriesWithIssues: reposWithIssues.size,
          healthScore: {
            score: clampedScore,
            status,
            factors: {
              criticalDeduction: -(criticalFindings * 25),
              highDeduction: -(highFindings * 10),
              openCriticals: criticalFindings,
              openHighs: highFindings,
              repoCoverage: `${scannedRepositories}/${totalRepositories || 1}`,
              resolvedCount: resolvedFindings,
            },
          },
        },
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const { stats, projects, findings } = data;

  // Category counts
  const categoryCounts = findings.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Global In-App Announcements */}
        <div className="mb-6">
          <AnnouncementBanner />
        </div>

        {/* Getting Started Onboarding Checklist */}
        <div className="mb-6">
          <OnboardingChecklist />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Security Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Multi-project credential exposure & automated prevention posture
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              className="gap-1.5 text-xs border-border/60 hover:bg-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/projects/new">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Health Score Banner */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 relative overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Security Posture Index
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  stats.healthScore.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  stats.healthScore.score >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {stats.healthScore.status}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.healthScore.score >= 80 ? 'Robust Defense Posture' :
                 stats.healthScore.score >= 50 ? 'Action Required on Open Findings' :
                 'Critical Secret Exposure Risk'}
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Deterministic calculation derived from active critical credentials (-25/ea), high findings (-10/ea), repository coverage ({stats.healthScore.factors.repoCoverage}), and resolved remediations.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center bg-secondary/40 border border-border/50 rounded-xl px-5 py-3">
                <div className="text-3xl sm:text-4xl font-black text-primary font-mono">
                  {stats.healthScore.score}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/100</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                  Health Index
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHealthModal(true)}
                className="gap-1.5 text-xs border-border/60"
              >
                <Info className="w-3.5 h-3.5" />
                Score Breakdown
              </Button>
            </div>
          </div>
        </div>

        {/* 7 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">Total Projects</div>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.totalProjects}</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <FolderGit2 className="w-3 h-3 text-primary" /> {stats.totalRepositories} Repositories
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">Open Findings</div>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.openFindings}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {stats.criticalFindings > 0 ? (
                <span className="text-red-400 font-semibold">{stats.criticalFindings} Critical</span>
              ) : '0 Critical findings'}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">Secrets This Week</div>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.secretsThisWeek}</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-yellow-400" /> Recent velocity
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">Resolved Findings</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.resolvedFindings}</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Remediated / FP
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Severity Distribution */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Severity Distribution
            </h3>

            <div className="space-y-3">
              {[
                { label: 'CRITICAL', count: stats.criticalFindings, color: 'bg-red-500', text: 'text-red-400' },
                { label: 'HIGH', count: stats.highFindings, color: 'bg-orange-500', text: 'text-orange-400' },
                { label: 'MEDIUM', count: findings.filter(f => f.status === 'OPEN' && f.severity === 'MEDIUM').length, color: 'bg-yellow-500', text: 'text-yellow-400' },
                { label: 'LOW', count: findings.filter(f => f.status === 'OPEN' && f.severity === 'LOW').length, color: 'bg-blue-500', text: 'text-blue-400' },
              ].map(item => {
                const pct = stats.openFindings > 0 ? (item.count / stats.openFindings) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={item.text}>{item.label}</span>
                      <span className="font-mono text-muted-foreground">{item.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secret Categories */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Detected Secret Categories
            </h3>

            {Object.keys(categoryCounts).length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No secrets detected across scanned repositories.
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/30 text-xs">
                    <span className="font-medium text-foreground">{cat}</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-primary" />
              Active Projects & Security Status
            </h3>
            <Link href="/projects" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              View all projects <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-border/50 rounded-xl">
              <FolderGit2 className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-foreground">No projects yet</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Create a project to connect repositories and establish baseline scans.
              </p>
              <Link href="/projects/new">
                <Button size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground">
                  <Plus className="w-3.5 h-3.5" /> Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-bold">Project Name</th>
                    <th className="pb-2.5 font-bold">Repositories</th>
                    <th className="pb-2.5 font-bold">Open Findings</th>
                    <th className="pb-2.5 font-bold">Health Status</th>
                    <th className="pb-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 font-semibold text-foreground">
                        <Link href={`/projects/${p.id}`} className="hover:text-primary transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground font-mono">
                        {p.repositories?.length || 0}
                      </td>
                      <td className="py-3 font-mono">
                        {p.stats?.criticalCount > 0 ? (
                          <span className="text-red-400 font-bold">{p.stats.criticalCount} Critical</span>
                        ) : p.stats?.openFindings > 0 ? (
                          <span className="text-yellow-400 font-bold">{p.stats.openFindings} Findings</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">0 Clean</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stats?.securityHealth?.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          p.stats?.securityHealth?.score >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {p.stats?.securityHealth?.score || 100}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                            View <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Health Breakdown Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Health Calculation Model
              </h3>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              SecretShield computes the health index dynamically from real scanner output and repository coverage rather than arbitrary heuristics:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                <span className="font-semibold text-foreground">Base Score</span>
                <span className="font-mono text-primary font-bold">100 pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <span>Active Critical Credentials ({stats.healthScore.factors.openCriticals} × -25)</span>
                <span className="font-mono font-bold">{stats.healthScore.factors.criticalDeduction} pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <span>Active High Severity Secrets ({stats.healthScore.factors.openHighs} × -10)</span>
                <span className="font-mono font-bold">{stats.healthScore.factors.highDeduction} pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                <span>Repository Scan Coverage ({stats.healthScore.factors.repoCoverage})</span>
                <span className="font-mono text-muted-foreground font-semibold">Active</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowHealthModal(false)} size="sm" className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
