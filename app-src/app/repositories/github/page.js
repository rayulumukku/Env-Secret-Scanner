'use client';

import { useState, useEffect, useCallback, Suspense, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitBranch, Search, Lock, Globe, Star, RefreshCw,
  AlertTriangle, ChevronRight, Zap, LogOut, Shield,
  Clock, Code2, Info, CheckCircle2, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── HELPERS ────────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── BRANCH PICKER ─────────────────────────────────────────────────────────────

function BranchPicker({ owner, repo, defaultBranch, onScan, scanning }) {
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(defaultBranch || 'main');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('current'); // 'current' | 'history'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/providers/github/${owner}/${repo}/branches`);
        const data = await res.json();
        if (data.branches) {
          setBranches(data.branches);
          const def = data.branches.find(b => b.name === defaultBranch);
          if (def) setSelected(def.name);
        }
      } catch {
        setBranches([{ name: defaultBranch || 'main' }]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repo, defaultBranch]);

  return (
    <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        Configure Scan — {owner}/{repo}
      </h3>

      {/* Branch select */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Branch</label>
        {loading ? (
          <div className="h-9 bg-secondary/50 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {branches.map(b => (
              <option key={b.name} value={b.name}>{b.name}{b.protected ? ' 🔒' : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* Scan mode */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Scan Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'current', label: 'Current Code', desc: 'Scans files currently in the branch' },
            { id: 'history', label: 'Current + History', desc: 'Also scans Git commit history' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                mode === m.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="text-xs font-semibold text-foreground">{m.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onScan(owner, repo, selected, mode)}
        disabled={scanning}
        className="w-full gap-2 font-semibold"
      >
        {scanning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
        ) : (
          <><Zap className="w-4 h-4" /> Start Scan</>
        )}
      </Button>
    </div>
  );
}

// ── REPO CARD ─────────────────────────────────────────────────────────────────

function RepoCard({ repo, onSelect, selected }) {
  return (
    <div
      className={`rounded-xl border transition-all duration-150 cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border/60 bg-card/40 hover:bg-card/70 hover:border-border'
      }`}
      onClick={() => onSelect(repo)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={repo.owner?.avatarUrl}
              alt={repo.owner?.login}
              className="w-7 h-7 rounded-full flex-shrink-0 ring-1 ring-border"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{repo.fullName}</div>
              {repo.description && (
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {repo.isPrivate ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3" /> Private
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Globe className="w-3 h-3" /> Public
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {repo.defaultBranch}
          </span>
          {repo.language && <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> {repo.language}</span>}
          {repo.stargazers > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers}</span>}
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" /> {timeAgo(repo.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── NOT CONFIGURED STATE ──────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20 px-4">
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto mb-6">
        <GitBranch className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">GitHub OAuth Not Configured</h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
        To connect GitHub, set the following environment variables on your server:
      </p>
      <div className="text-left bg-secondary/30 border border-border/60 rounded-xl p-5 mb-8 font-mono text-sm space-y-1">
        <div><span className="text-primary">GITHUB_CLIENT_ID</span>=your_client_id</div>
        <div><span className="text-primary">GITHUB_CLIENT_SECRET</span>=your_client_secret</div>
        <div><span className="text-muted-foreground"># Optional:</span></div>
        <div><span className="text-primary">GITHUB_REDIRECT_URI</span>=https://yourdomain.com/api/providers/github/callback</div>
        <div><span className="text-primary">NEXT_PUBLIC_BASE_URL</span>=https://yourdomain.com</div>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Create a GitHub OAuth App at <strong>Settings → Developer Settings → OAuth Apps</strong>.
        Set the callback URL to <code className="bg-secondary px-1 py-0.5 rounded">/api/providers/github/callback</code>.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/repositories/new">
          <Button variant="outline" className="gap-2">Upload ZIP instead</Button>
        </Link>
        <a
          href="https://github.com/settings/developers"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="gap-2">
            <ExternalLink className="w-4 h-4" /> Create OAuth App
          </Button>
        </a>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

function GitHubRepositoriesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [configured, setConfigured] = useState(null); // null = loading
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);

  // OAuth callback messages
  useEffect(() => {
    startTransition(() => {
      const err = searchParams.get('error');
      if (err) setError(decodeURIComponent(err));
    });
  }, [searchParams]);

  // Check if GitHub is configured + if user is connected
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/providers/github/repositories');
        if (res.status === 503) {
          setConfigured(false);
          return;
        }
        setConfigured(true);
        if (res.status === 401) {
          setConnected(false);
          return;
        }
        const data = await res.json();
        if (data.user) {
          setConnected(true);
          setUser(data.user);
          setRepos(data.repositories || []);
          setFiltered(data.repositories || []);
          setHasMore(data.hasMore);
        }
      } catch {
        setConfigured(false);
      }
    }
    checkStatus();
  }, []);

  // Filter repos by query
  useEffect(() => {
    startTransition(() => {
      if (!query) {
        setFiltered(repos);
      } else {
        const q = query.toLowerCase();
        setFiltered(repos.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.language?.toLowerCase().includes(q)
        ));
      }
    });
  }, [query, repos]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/providers/github/repositories?page=${nextPage}`);
      const data = await res.json();
      if (data.repositories) {
        setRepos(r => [...r, ...data.repositories]);
        setPage(nextPage);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleDisconnect = async () => {
    await fetch('/api/providers/github/repositories', { method: 'DELETE' });
    setConnected(false);
    setUser(null);
    setRepos([]);
    setSelectedRepo(null);
  };

  const handleScan = async (owner, repo, branch, mode) => {
    setScanning(true);
    setScanProgress('Downloading repository…');
    setError(null);

    try {
      const [ownerName, repoName] = `${owner}/${repo}`.split('/');

      // Scan current code
      const res = await fetch(`/api/providers/github/${ownerName}/${repoName}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, config: { includeHidden: true } }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Scan failed (${res.status})`);
      }

      const result = await res.json();

      // Store in sessionStorage (masked data only)
      sessionStorage.setItem(`repo_scan_${result.scanId}`, JSON.stringify(result));

      // Persist to history
      const history = JSON.parse(localStorage.getItem('secretshield_repo_history') || '[]');
      history.unshift({
        scanId:     result.scanId,
        timestamp:  result.timestamp,
        duration:   result.duration,
        repository: result.repository,
        statistics: result.statistics,
      });
      localStorage.setItem('secretshield_repo_history', JSON.stringify(history.slice(0, 50)));

      // Navigate to results (with history flag if requested)
      const url = mode === 'history'
        ? `/repositories/${result.scanId}?runHistory=1`
        : `/repositories/${result.scanId}`;
      router.push(url);

    } catch (err) {
      setError(err.message);
      setScanning(false);
      setScanProgress(null);
    }
  };

  // ── LOADING STATE ────────────────────────────────────────────────────────
  if (configured === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── NOT CONFIGURED ───────────────────────────────────────────────────────
  if (!configured) {
    return <div className="min-h-screen bg-background"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-12"><NotConfigured /></div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/repositories" className="hover:text-foreground transition-colors">Repositories</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground">GitHub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-primary" />
              GitHub Repositories
            </h1>
          </div>

          {connected && user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                {user.avatarUrl && (
                  <img src={user.avatarUrl} alt={user.login} className="w-6 h-6 rounded-full" />
                )}
                <span className="text-muted-foreground">{user.name || user.login}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Scan progress */}
        {scanning && scanProgress && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/60">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{scanProgress}</span>
          </div>
        )}

        {/* Not connected — Connect CTA */}
        {!connected && (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto mb-6">
              <GitBranch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your GitHub Account</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Grant read-only access to scan your repositories for exposed secrets.
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <a href="/api/providers/github/connect">
                <Button className="gap-2 font-semibold">
                  <GitBranch className="w-4 h-4" /> Connect GitHub
                </Button>
              </a>
              <Link href="/repositories/new">
                <Button variant="outline">Upload ZIP instead</Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Read-only access · Token stored in secure HTTP-only cookie · Never exposed to JS
            </div>
          </div>
        )}

        {/* Repository list */}
        {connected && (
          <div className="flex gap-6">
            {/* Left: repo list */}
            <div className="flex-1 min-w-0">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search repositories…"
                  className="w-full pl-9 pr-4 py-2 bg-secondary/40 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                {filtered.map(r => (
                  <RepoCard
                    key={r.fullName}
                    repo={r}
                    selected={selectedRepo?.fullName === r.fullName}
                    onSelect={setSelectedRepo}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {query ? `No repositories match "${query}"` : 'No repositories found.'}
                </div>
              )}

              {hasMore && !query && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="mt-4 w-full py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Load more
                </button>
              )}
            </div>

            {/* Right: branch picker */}
            {selectedRepo && (
              <div className="w-72 flex-shrink-0">
                <BranchPicker
                  owner={selectedRepo.owner?.login}
                  repo={selectedRepo.name}
                  defaultBranch={selectedRepo.defaultBranch}
                  onScan={handleScan}
                  scanning={scanning}
                />
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Archive is processed in-memory. Raw secrets never stored.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GitHubRepositoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GitHubRepositoriesInner />
    </Suspense>
  );
}
