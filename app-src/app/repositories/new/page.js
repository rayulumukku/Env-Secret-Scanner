'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, FolderArchive, GitBranch, Layers, Shield, AlertTriangle,
  CheckCircle2, FileCode2, ChevronRight, Zap, Lock, Info,
  Settings2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LIMITS } from '@/lib/repository/archive';

const MAX_MB = LIMITS.MAX_ARCHIVE_BYTES / 1024 / 1024;

const PROVIDERS = [
  {
    id: 'zip',
    label: 'Upload ZIP',
    icon: FolderArchive,
    description: 'Upload a .zip archive of your repository',
    available: true,
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: GitBranch,
    description: 'Connect your GitHub account',
    available: false,
    badge: 'Coming Soon',
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: Layers,
    description: 'Connect your GitLab account',
    available: false,
    badge: 'Coming Soon',
  },
];

const DEFAULT_CONFIG = {
  includeHidden: true,
  includeTests: true,
  includeDocs: false,
  maxFiles: 5000,
};

export default function NewRepositoryPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [provider, setProvider] = useState('zip');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // ── FILE SELECTION ──────────────────────────────────────────────────────
  const handleFileSelect = useCallback((selectedFile) => {
    setError(null);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setError('Only .zip archives are supported.');
      return;
    }

    if (selectedFile.size > LIMITS.MAX_ARCHIVE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_MB}MB.`);
      return;
    }

    if (selectedFile.size === 0) {
      setError('File is empty.');
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // ── SCAN ──────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);

    const stages = [
      { key: 'upload',    label: 'Uploading archive…',       pct: 10 },
      { key: 'extract',   label: 'Extracting files…',        pct: 30 },
      { key: 'scan',      label: 'Scanning for secrets…',    pct: 70 },
      { key: 'analyze',   label: 'Analyzing findings…',      pct: 90 },
      { key: 'finalize',  label: 'Finalizing report…',       pct: 98 },
    ];

    let stageIdx = 0;
    const advanceStage = () => {
      if (stageIdx < stages.length) {
        setProgress(stages[stageIdx]);
        stageIdx++;
      }
    };

    advanceStage();

    try {
      const formData = new FormData();
      formData.append('archive', file);
      formData.append('repositoryName', file.name.replace(/\.zip$/i, ''));
      formData.append('config', JSON.stringify(config));

      // Simulate stage advances while waiting
      const stageTimer = setInterval(() => advanceStage(), 1500);

      const res = await fetch('/api/repository/scan', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stageTimer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Scan failed (${res.status})`);
      }

      const result = await res.json();

      // Store safe result in sessionStorage for the results page
      // SECURITY: result already contains only masked values
      sessionStorage.setItem(`repo_scan_${result.scanId}`, JSON.stringify(result));

      // Also persist to scan history (safe metadata only)
      const history = JSON.parse(localStorage.getItem('secretshield_repo_history') || '[]');
      const historyRecord = {
        scanId:     result.scanId,
        timestamp:  result.timestamp,
        duration:   result.duration,
        repository: result.repository,
        statistics: result.statistics,
      };
      history.unshift(historyRecord);
      localStorage.setItem('secretshield_repo_history', JSON.stringify(history.slice(0, 50)));

      router.push(`/repositories/${result.scanId}`);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      setScanning(false);
      setProgress(null);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/repositories" className="hover:text-foreground transition-colors">Repositories</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">New Scan</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Scan a Repository
          </h1>
          <p className="text-muted-foreground">
            Upload a ZIP archive to scan for accidentally exposed secrets, API keys, and credentials.
          </p>
        </div>

        {/* Provider selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-3">Source</label>
          <div className="grid grid-cols-3 gap-3">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => p.available && setProvider(p.id)}
                  disabled={!p.available}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]'
                      : p.available
                        ? 'border-border bg-card hover:border-border/80 hover:bg-card/80'
                        : 'border-border/40 bg-card/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  )}
                  <Icon className={`w-5 h-5 mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {p.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ZIP Upload zone */}
        {provider === 'zip' && (
          <div className="mb-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : file
                    ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default'
                    : 'border-border hover:border-border/80 hover:bg-secondary/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {file ? (
                <div className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • ZIP archive ready
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">
                    Drop your repository ZIP here
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    or <span className="text-primary cursor-pointer">browse to upload</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {['.zip format only', `Max ${MAX_MB}MB`, 'Scanned in memory'].map((tag) => (
                      <span key={tag} className="text-[10px] font-medium bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Scan Configuration */}
        <div className="mb-6">
          <button
            onClick={() => setShowConfig(v => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {showConfig ? 'Hide' : 'Show'} scan configuration
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showConfig ? 'rotate-90' : ''}`} />
          </button>

          {showConfig && (
            <div className="mt-4 p-5 rounded-xl border border-border/60 bg-card/40 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File Inclusion
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'includeHidden', label: 'Hidden files (.env, .secrets)', desc: 'Include dotfiles' },
                  { key: 'includeTests', label: 'Test files', desc: 'Include test/ and spec/ files' },
                  { key: 'includeDocs', label: 'Documentation', desc: 'Include .md and .txt files' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={config[key]}
                        onChange={(e) => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                      />
                      <div className={`w-4 h-4 rounded border transition-colors ${
                        config[key] ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                      }`}>
                        {config[key] && (
                          <svg viewBox="0 0 16 16" fill="none" className="w-full h-full p-0.5">
                            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </label>
                ))}

                {/* Max files */}
                <div className="flex items-start gap-3">
                  <FileCode2 className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Max files
                    </label>
                    <select
                      value={config.maxFiles}
                      onChange={(e) => setConfig(c => ({ ...c, maxFiles: Number(e.target.value) }))}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={500}>500 files</option>
                      <option value={1000}>1,000 files</option>
                      <option value={2500}>2,500 files</option>
                      <option value={5000}>5,000 files</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Source code and configuration files are always scanned.
                  node_modules, .git, dist, and binary files are always excluded.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Privacy notice */}
        <div className="mb-8 flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/30 border border-border/40">
          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your archive is processed in-memory on the server and immediately discarded after scanning.
            Raw file contents and secrets are never persisted. Only masked findings and metadata are returned.
            <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</a>
          </p>
        </div>

        {/* Scan progress */}
        {scanning && progress && (
          <div className="mb-6 p-5 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div className="text-sm font-medium text-foreground">{progress.label}</div>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>Processing…</span>
              <span>{progress.pct}%</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleScan}
            disabled={!file || scanning}
            size="lg"
            className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Start Scan
              </>
            )}
          </Button>
          <Link href="/repositories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>

        {/* Security notes */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Security Hardening
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Shield, label: 'Zip Slip prevention' },
              { icon: Shield, label: 'ZIP bomb detection' },
              { icon: Shield, label: 'Path traversal blocked' },
              { icon: Shield, label: 'Binary files skipped' },
              { icon: Shield, label: 'Symlinks rejected' },
              { icon: Shield, label: 'Secrets masked in output' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
