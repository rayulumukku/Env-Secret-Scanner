'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderGit2, Shield, AlertTriangle, CheckCircle2, Clock,
  Key, Plus, Trash2, Settings, FileCode2, Terminal,
  ExternalLink, ArrowLeft, RefreshCw, Layers,
  GitCompare, TrendingUp, GitPullRequest
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const projectId = params.id;
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [connectModal, setConnectModal] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [ruleModal, setRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '', severity: 'HIGH' });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject() {
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/projects');
      router.refresh();
    }
  }

  async function handleConnectRepo(e) {
    e.preventDefault();
    if (!repoName) return;

    await fetch(`/api/projects/${projectId}/repositories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: repoName, fullName: repoName }),
    });
    setRepoName('');
    setConnectModal(false);
    loadProject();
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    if (!newRule.name || !newRule.pattern) return;

    await fetch(`/api/projects/${projectId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    setNewRule({ name: '', pattern: '', severity: 'HIGH' });
    setRuleModal(false);
    loadProject();
  }

  if (loading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" /> Loading project details…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Project not found</h2>
        <Link href="/projects" className="text-xs text-primary underline mt-2 block">
          Return to projects
        </Link>
      </div>
    );
  }

  const openFindings = project.findings?.filter(f => f.status === 'OPEN') || [];
  const criticalCount = openFindings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = openFindings.filter(f => f.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Top Breadcrumb */}
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> All Projects
        </Link>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border/60 text-muted-foreground uppercase font-mono">
                  {project.slug}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/projects/${projectId}/compare`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-border/80 hover:bg-secondary">
                <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                Branch Compare
              </Button>
            </Link>

            <Link href={`/projects/${projectId}/security-trends`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-border/80 hover:bg-secondary">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Security Trends
              </Button>
            </Link>

            <Link href={`/projects/${projectId}/pull-requests`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-border/80 hover:bg-secondary">
                <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                Pull Requests
              </Button>
            </Link>

            <Link href="/scan">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                <Terminal className="w-3.5 h-3.5" />
                Scan Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-px mb-8 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview',     label: 'Overview' },
            { id: 'repositories', label: `Repositories (${project.repositories?.length || 0})` },
            { id: 'findings',     label: `Findings (${openFindings.length})` },
            { id: 'scans',        label: `Scans (${project.scans?.length || 0})` },
            { id: 'rules',        label: `Rules (${project.customRules?.length || 0})` },
            { id: 'baselines',    label: `Baselines (${project.baselines?.length || 0})` },
            { id: 'settings',     label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/50 bg-card/40">
                <div className="text-xs text-muted-foreground">Connected Repositories</div>
                <div className="text-2xl font-bold font-mono text-foreground mt-1">{project.repositories?.length || 0}</div>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card/40">
                <div className="text-xs text-muted-foreground">Active Open Findings</div>
                <div className="text-2xl font-bold font-mono text-foreground mt-1">
                  {criticalCount > 0 ? (
                    <span className="text-red-400">{criticalCount} Critical</span>
                  ) : openFindings.length > 0 ? (
                    <span className="text-yellow-400">{openFindings.length}</span>
                  ) : (
                    <span className="text-emerald-400">0 Clean</span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card/40">
                <div className="text-xs text-muted-foreground">Enforced Policy Threshold</div>
                <div className="text-2xl font-bold font-mono text-primary mt-1">{project.severityThreshold || 'LOW'}</div>
              </div>
            </div>

            {/* Repository Intelligence Highlights */}
            <div className="p-5 rounded-2xl border border-border/50 bg-card/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Advanced Repository Intelligence
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Real-time Branch Analysis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href={`/projects/${projectId}/compare`}
                  className="p-3.5 rounded-xl bg-background/60 border border-border/60 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-cyan-400 flex items-center gap-1.5">
                      <GitCompare className="w-3.5 h-3.5 text-cyan-400" /> Branch Compare
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Diff base vs compare branches to isolate newly introduced secrets from pre-existing ones.
                  </p>
                </Link>

                <Link
                  href={`/projects/${projectId}/security-trends`}
                  className="p-3.5 rounded-xl bg-background/60 border border-border/60 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Security Trends
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Review detection and remediation velocity over 7d, 30d, 90d, and all-time.
                  </p>
                </Link>

                <Link
                  href={`/projects/${projectId}/pull-requests`}
                  className="p-3.5 rounded-xl bg-background/60 border border-border/60 hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-purple-400 flex items-center gap-1.5">
                      <GitPullRequest className="w-3.5 h-3.5 text-purple-400" /> PR Intelligence
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-purple-400" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Automated PR gate audits that prevent blocking developers for legacy baseline findings.
                  </p>
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-border/50 bg-card/30">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  CLI & Git Hook Integration
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Run deterministic secret checks locally before code leaves developer machines:
                </p>
                <div className="p-3 rounded-lg bg-[oklch(0.08_0.004_240)] font-mono text-xs text-foreground/80 space-y-1">
                  <div>$ secretshield scan .</div>
                  <div>$ secretshield install-hook</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border/50 bg-card/30">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  GitHub Actions & SARIF 2.1.0
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Automate CI/CD scanning and upload security findings to GitHub Advanced Security:
                </p>
                <div className="p-3 rounded-lg bg-[oklch(0.08_0.004_240)] font-mono text-xs text-foreground/80 space-y-1">
                  <div>$ secretshield ci --fail-on {project.severityThreshold?.toLowerCase() || 'high'}</div>
                  <div>$ secretshield scan --sarif &gt; results.sarif</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Repositories */}
        {activeTab === 'repositories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Repositories in {project.name}</h3>
              <Button size="sm" onClick={() => setConnectModal(true)} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Connect Repository
              </Button>
            </div>

            {(!project.repositories || project.repositories.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
                <FolderGit2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground mb-3">No repositories connected yet.</p>
                <Button size="sm" onClick={() => setConnectModal(true)} className="text-xs">
                  Connect First Repository
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
                {project.repositories.map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Branch: <span className="font-mono">{r.defaultBranch}</span> • Provider: {r.provider}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">
                        {r.lastScannedAt ? `Scanned ${new Date(r.lastScannedAt).toLocaleDateString()}` : 'Not scanned yet'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Findings */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Open Findings</h3>
            {openFindings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-foreground">No active findings</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">This project is currently clean.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
                {openFindings.map(f => (
                  <div key={f.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="font-bold text-foreground">{f.type}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-1">
                        {f.file}:{f.line} • Masked: <span className="text-foreground">{f.maskedValue}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        Conf: {f.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Scans */}
        {activeTab === 'scans' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Scan Execution History</h3>
            {(!project.scans || project.scans.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground">No scans executed yet for this project.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
                {project.scans.map(s => (
                  <div key={s.id || s.scanId} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground font-mono">{s.scanId}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(s.scannedAt).toLocaleString()} • Duration: {s.durationMs}ms
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.criticalCount > 0 ? 'text-red-400 bg-red-500/10' :
                        s.totalFindings > 0 ? 'text-yellow-400 bg-yellow-500/10' :
                        'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {s.totalFindings} Findings ({s.criticalCount} Critical)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Custom Detection Rules</h3>
              <Button size="sm" onClick={() => setRuleModal(true)} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </Button>
            </div>

            {(!project.customRules || project.customRules.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
                <Key className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground mb-3">No custom rules configured.</p>
                <Button size="sm" onClick={() => setRuleModal(true)} className="text-xs">Add Rule</Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
                {project.customRules.map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{r.pattern}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                      {r.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Baselines */}
        {activeTab === 'baselines' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Project Baselines</h3>
            {(!project.baselines || project.baselines.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
                <Layers className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground">No baselines created for this project yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">Generate baselines via `secretshield baseline create`</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
                {project.baselines.map(b => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {b.activeCount} fingerprints suppressed
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Settings & Danger Zone */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl">
            <div className="p-6 rounded-2xl border border-border/50 bg-card/40 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Project Configuration</h3>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Project Name</label>
                <input
                  type="text"
                  defaultValue={project.name}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Severity Fail Threshold</label>
                <input
                  type="text"
                  defaultValue={project.severityThreshold || 'LOW'}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-muted-foreground"
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-muted-foreground">
                Permanently delete this project, connected repository metadata, and recorded scan findings.
              </p>

              {deleteConfirm ? (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 space-y-2">
                  <p className="text-xs text-red-300 font-semibold">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleDeleteProject} size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs">
                      Yes, Delete Project
                    </Button>
                    <Button onClick={() => setDeleteConfirm(false)} variant="outline" size="sm" className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setDeleteConfirm(true)} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Project
                </Button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Connect Repo Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Connect Repository</h3>
            <form onSubmit={handleConnectRepo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Repository Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={repoName}
                  onChange={e => setRepoName(e.target.value)}
                  placeholder="e.g. backend-api"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setConnectModal(false)} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" className="text-xs bg-primary text-primary-foreground">Connect</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Rule Modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add Custom Detection Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Internal API Token"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Regex Pattern</label>
                <input
                  type="text"
                  required
                  value={newRule.pattern}
                  onChange={e => setNewRule({ ...newRule, pattern: e.target.value })}
                  placeholder="CORP_[A-Z0-9]{32}"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none focus:border-primary font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRuleModal(false)} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" className="text-xs bg-primary text-primary-foreground">Save Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
