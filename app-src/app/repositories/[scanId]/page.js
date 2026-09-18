'use client';

import { useState, useEffect, startTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, ChevronRight, AlertTriangle, FileCode2, FolderOpen,
  Folder, Download, Clock, Hash, BarChart3, CheckCircle2,
  ChevronDown, X, Info, Eye, History, ExternalLink, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    dot: 'bg-red-400',    label: 'Critical' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-400', label: 'High' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-400', label: 'Medium' },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   dot: 'bg-blue-400',   label: 'Low' },
};

const SEVERITY_EMOJI = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵' };

const GROUP_MODES = [
  { id: 'severity', label: 'Severity' },
  { id: 'file',     label: 'File' },
  { id: 'category', label: 'Type' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

// ── REMEDIATION ADVICE ────────────────────────────────────────────────────────

function getRemediation(finding) {
  const type = finding.type || '';

  if (type.includes('AWS')) return [
    'Revoke the AWS access key immediately in IAM console.',
    'Generate a new key pair and rotate all usages.',
    'Move credentials to environment variables or AWS Secrets Manager.',
    'Remove the credential from source control history using git-filter-repo.',
    'Check CloudTrail for unauthorized API calls during the exposure window.',
  ];
  if (type.includes('GITHUB')) return [
    'Immediately revoke the token in GitHub → Settings → Developer Settings.',
    'Generate a new Personal Access Token with minimum required scopes.',
    'Store in environment variables, never in source code.',
    'Audit recent API calls made with this token in GitHub Security logs.',
  ];
  if (type.includes('STRIPE')) return [
    'Revoke the key in the Stripe Dashboard → Developers → API keys.',
    'Issue a new key and update all integrations.',
    'Use environment variables or a secrets manager.',
    'Review the Stripe Dashboard for unauthorized charges.',
  ];
  if (type.includes('DATABASE') || type.includes('POSTGRES') || type.includes('MONGO')) return [
    'Rotate the database password immediately.',
    'Update connection strings in all environments.',
    'Use connection pooling tools like PgBouncer that separate credentials.',
    'Review database access logs for unauthorized connections.',
    'Move credentials to environment variables or a vault.',
  ];
  if (type.includes('PRIVATE_KEY')) return [
    'Immediately revoke and regenerate the private key.',
    'Remove the key from all source control history.',
    'Rotate any certificates or services using this key.',
    'Private keys should NEVER be committed to source control.',
  ];
  if (type.includes('JWT')) return [
    'Invalidate the JWT signing secret immediately.',
    'Rotate the secret and re-issue tokens to all users.',
    'Store JWT secrets in environment variables.',
    'Audit token usage logs for suspicious activity.',
  ];

  return [
    'Revoke or rotate the exposed credential immediately.',
    'Generate a replacement and update all systems.',
    'Move the credential to environment variables or a secrets manager.',
    'Remove from source control history using git-filter-repo.',
    'Check access logs for unauthorized usage during the exposure window.',
  ];
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'text-foreground', sub }) {
  return (
    <div className="p-4 rounded-xl border border-border/60 bg-card/40">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── FINDING CARD ──────────────────────────────────────────────────────────────

function FindingCard({ finding, onSelect, selected }) {
  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.LOW;
  return (
    <button
      onClick={() => onSelect(finding)}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 hover:border-border ${
        selected
          ? `${cfg.border} ${cfg.bg}`
          : 'border-border/50 bg-card/30 hover:bg-card/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {finding.description || finding.type}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {finding.file}:{finding.line}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </span>
          {finding.confidence !== undefined && (
            <span className="text-[10px] text-muted-foreground">{finding.confidence}%</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── FILE TREE NODE ────────────────────────────────────────────────────────────

function FileTreeNode({ node, findingsByFile, onFileSelect, selectedFile, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);

  const hasFindings = node.files.some(f => f.findingCount > 0) ||
    Object.values(node.children || {}).some(c => {
      const walk = (n) => n.files.some(f => f.findingCount > 0) || Object.values(n.children || {}).some(walk);
      return walk(c);
    });

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 w-full py-1 px-2 rounded-md hover:bg-secondary/40 text-left text-sm transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open
            ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            : <Folder className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          }
          <span className="flex-1 font-medium text-foreground truncate text-xs">{node.name}</span>
          {hasFindings && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
          <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      )}

      {(open || !node.name) && (
        <div>
          {/* Child directories */}
          {(node.children || []).map(child => (
            <FileTreeNode
              key={child.path || child.name}
              node={child}
              findingsByFile={findingsByFile}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              depth={depth + 1}
            />
          ))}

          {/* Files */}
          {node.files.map(file => {
            const cfg = file.maxSeverity ? SEVERITY_CONFIG[file.maxSeverity] : null;
            const isSelected = selectedFile === file.path;

            return (
              <button
                key={file.path}
                onClick={() => onFileSelect(file.path)}
                className={`flex items-center gap-1.5 w-full py-1 px-2 rounded-md text-left text-xs transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                <FileCode2 className="w-3 h-3 flex-shrink-0" />
                <span className="flex-1 truncate font-mono">{file.name}</span>
                {file.findingCount > 0 && cfg && (
                  <span className={`text-[9px] font-bold ${cfg.color} flex-shrink-0`}>
                    {SEVERITY_EMOJI[file.maxSeverity]} {file.findingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FINDING DETAIL PANEL ──────────────────────────────────────────────────────

function FindingDetailPanel({ finding, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!finding) return null;
  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.LOW;
  const remediation = getRemediation(finding);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(finding.fingerprint || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border mb-2 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label} Severity
          </div>
          <h3 className="font-semibold text-foreground text-sm">
            {finding.description || finding.type}
          </h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Type', value: finding.type },
            { label: 'Category', value: finding.category },
            { label: 'File', value: finding.file, mono: true },
            { label: 'Line', value: finding.line },
            { label: 'Confidence', value: finding.confidence !== undefined ? `${finding.confidence}%` : '—' },
            { label: 'Rule', value: finding.rule || finding.type },
          ].map(({ label, value, mono }) => (
            <div key={label} className="p-3 rounded-lg bg-secondary/30 border border-border/40">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-xs text-foreground break-all ${mono ? 'font-mono' : ''}`}>
                {value || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Masked value */}
        {finding.maskedValue && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Masked Value
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 font-mono text-xs text-muted-foreground break-all">
              {finding.maskedValue}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              The actual secret is not shown. Only a masked preview is displayed.
            </p>
          </div>
        )}

        {/* Detection signals */}
        {finding.signals && finding.signals.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Why this was detected
            </div>
            <div className="space-y-1.5">
              {finding.signals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`flex-shrink-0 mt-0.5 font-bold ${signal.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {signal.positive ? '✓' : '−'}
                  </span>
                  <span className="text-muted-foreground">{signal.label}</span>
                  <span className={`ml-auto font-mono flex-shrink-0 ${signal.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {signal.score > 0 ? '+' : ''}{signal.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remediation */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            How to remediate
          </div>
          <ol className="space-y-2">
            {remediation.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-secondary border border-border/50 flex items-center justify-center font-bold text-[9px] text-foreground flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Prevention */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            How to prevent this
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {[
              'Use environment variables (.env) and add .env to .gitignore.',
              'Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.).',
              'Add SecretShield or similar tooling to your CI/CD pipeline.',
              'Enable pre-commit hooks with secret scanning.',
              'Rotate credentials on a regular schedule.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <Shield className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Fingerprint */}
        {finding.fingerprint && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Fingerprint
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] font-mono text-muted-foreground bg-secondary/30 border border-border/40 px-2 py-1.5 rounded-md break-all">
                {finding.fingerprint}
              </code>
              <button
                onClick={copyFingerprint}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── REPORT EXPORT ─────────────────────────────────────────────────────────────

function exportJSON(result) {
  const report = {
    meta: {
      tool: 'SecretShield',
      version: '1.0',
      generated: new Date().toISOString(),
      scanId: result.scanId,
    },
    repository: result.repository,
    statistics: result.statistics,
    findings: result.findings.map(f => ({
      type:        f.type,
      category:    f.category,
      severity:    f.severity,
      confidence:  f.confidence,
      file:        f.file,
      line:        f.line,
      column:      f.column,
      maskedValue: f.maskedValue,   // masked only — no raw secrets
      fingerprint: f.fingerprint,
      description: f.description,
      signals:     f.signals,
    })),
    config: result.config,
    errors: result.errors,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `secretshield-${result.scanId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportHTML(result) {
  const severityColors = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  };

  const findingRows = result.findings.map(f => `
    <tr>
      <td style="color:${severityColors[f.severity] || '#888'};font-weight:bold">${f.severity}</td>
      <td>${f.type || '—'}</td>
      <td style="font-family:monospace;font-size:12px">${f.file}:${f.line}</td>
      <td style="font-family:monospace;font-size:12px">${f.maskedValue || '—'}</td>
      <td>${f.confidence ?? '—'}%</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SecretShield Report — ${result.repository?.name || result.scanId}</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0f0f0f; color: #e5e5e5; max-width: 960px; margin: 0 auto; padding: 40px 20px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .sub { color: #888; font-size: 14px; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 16px; }
  .card .num { font-size: 28px; font-weight: bold; font-family: monospace; }
  .card .lbl { color: #888; font-size: 12px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #666; border-bottom: 1px solid #333; padding: 8px 12px; }
  td { padding: 10px 12px; border-bottom: 1px solid #222; font-size: 13px; }
  tr:hover td { background: #1a1a1a; }
  .footer { margin-top: 40px; color: #555; font-size: 11px; border-top: 1px solid #222; padding-top: 16px; }
  .notice { background: #1a1a00; border: 1px solid #333300; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #888; margin-bottom: 24px; }
</style>
</head>
<body>
<h1>🛡 SecretShield — Security Report</h1>
<div class="sub">
  Repository: ${result.repository?.name || '—'} &nbsp;|&nbsp;
  Scan ID: ${result.scanId} &nbsp;|&nbsp;
  Date: ${new Date(result.timestamp).toLocaleString()} &nbsp;|&nbsp;
  Duration: ${formatDuration(result.duration)}
</div>
<div class="notice">
  ⚠ This report contains <strong>masked credential values only</strong>. 
  Raw secrets are never included in SecretShield reports.
</div>
<div class="grid">
  <div class="card"><div class="num" style="color:#ef4444">${result.statistics?.CRITICAL ?? 0}</div><div class="lbl">Critical</div></div>
  <div class="card"><div class="num" style="color:#f97316">${result.statistics?.HIGH ?? 0}</div><div class="lbl">High</div></div>
  <div class="card"><div class="num" style="color:#eab308">${result.statistics?.MEDIUM ?? 0}</div><div class="lbl">Medium</div></div>
  <div class="card"><div class="num" style="color:#3b82f6">${result.statistics?.LOW ?? 0}</div><div class="lbl">Low</div></div>
</div>
<p style="color:#888;font-size:13px;margin-bottom:20px">
  Files scanned: <strong style="color:#e5e5e5">${result.statistics?.filesScanned ?? 0}</strong> &nbsp;&bull;&nbsp;
  Files skipped: ${result.statistics?.filesSkipped ?? 0}
</p>
<table>
  <thead><tr><th>Severity</th><th>Type</th><th>Location</th><th>Masked Value</th><th>Confidence</th></tr></thead>
  <tbody>${findingRows || '<tr><td colspan="5" style="text-align:center;color:#555;padding:32px">No findings detected</td></tr>'}</tbody>
</table>
<div class="footer">
  Generated by SecretShield · Raw secrets are never stored or transmitted · ${new Date().toISOString()}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `secretshield-${result.scanId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function RepositoryScanResultPage() {
  const { scanId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [groupMode, setGroupMode] = useState('severity');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load from sessionStorage
  useEffect(() => {
    startTransition(() => {
      try {
        const raw = sessionStorage.getItem(`repo_scan_${scanId}`);
        if (!raw) {
          setError('Scan result not found. It may have expired. Please run a new scan.');
          return;
        }
        setResult(JSON.parse(raw));
      } catch {
        setError('Failed to load scan result.');
      }
    });
  }, [scanId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Result Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Link href="/repositories/new">
            <Button className="gap-2">Run New Scan</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = result.statistics || {};
  const findings = result.findings || [];
  const hasFindings = findings.length > 0;

  // Build grouped findings for display
  const grouped = (() => {
    if (groupMode === 'severity') {
      return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        .filter(sev => findings.some(f => f.severity === sev))
        .map(sev => ({
          key: sev,
          label: `${SEVERITY_EMOJI[sev]} ${SEVERITY_CONFIG[sev].label}`,
          cfg: SEVERITY_CONFIG[sev],
          items: findings.filter(f => f.severity === sev),
        }));
    }
    if (groupMode === 'file') {
      const byFile = {};
      for (const f of findings) {
        if (!byFile[f.file]) byFile[f.file] = [];
        byFile[f.file].push(f);
      }
      return Object.entries(byFile).map(([file, items]) => ({
        key: file,
        label: file,
        cfg: SEVERITY_CONFIG[items[0].severity] || SEVERITY_CONFIG.LOW,
        items,
      }));
    }
    // By category
    const byCat = {};
    for (const f of findings) {
      const cat = f.category || 'Other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(f);
    }
    return Object.entries(byCat).map(([cat, items]) => ({
      key: cat,
      label: cat,
      cfg: SEVERITY_CONFIG[items[0].severity] || SEVERITY_CONFIG.LOW,
      items,
    }));
  })();

  // Findings for the selected file
  const fileFindings = selectedFile
    ? findings.filter(f => f.file === selectedFile)
    : findings;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-16 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/repositories" className="text-muted-foreground hover:text-foreground transition-colors">
              Repositories
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {result.repository?.name || scanId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/repositories/${scanId}/history`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              History
            </Link>
            <Link
              href={`/repositories/${scanId}/compare`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Compare
            </Link>
            <button
              onClick={() => exportJSON(result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              onClick={() => exportHTML(result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Summary stats */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h1 className="text-2xl font-bold tracking-tight">{result.repository?.name || 'Scan Results'}</h1>
            {hasFindings ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {findings.length} Finding{findings.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ No Secrets Detected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatDate(result.timestamp)}</span>
            <span className="flex items-center gap-1.5"><FileCode2 className="w-3.5 h-3.5" />{stats.filesScanned ?? 0} files scanned</span>
            <span className="flex items-center gap-1.5">⏱ {formatDuration(result.duration)}</span>
            <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{scanId}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Critical" value={stats.CRITICAL ?? 0} color="text-red-400" />
            <StatCard label="High" value={stats.HIGH ?? 0} color="text-orange-400" />
            <StatCard label="Medium" value={stats.MEDIUM ?? 0} color="text-yellow-400" />
            <StatCard label="Low" value={stats.LOW ?? 0} color="text-blue-400" />
            <StatCard label="Total Findings" value={stats.total ?? 0} />
            <StatCard label="Files Scanned" value={stats.filesScanned ?? 0} />
            <StatCard label="Risk Score" value={`${stats.riskScore ?? 0}/100`} color={stats.riskScore > 50 ? 'text-red-400' : stats.riskScore > 25 ? 'text-orange-400' : 'text-emerald-400'} />
          </div>
        </div>

        {/* Git history banner */}
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 bg-secondary/20">
          <History className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">Historical scan</span>
            <span className="text-xs text-muted-foreground ml-2">
              Scanning Git commit history for past secret exposures is coming soon.
              Currently showing current file state only.
            </span>
          </div>
          <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
            Coming Soon
          </span>
        </div>

        {/* 3-column layout: file tree | findings | detail */}
        <div className="flex gap-4 min-h-[600px]">

          {/* FILE TREE — left column */}
          {result.fileTree && (
            <div className="w-64 flex-shrink-0 rounded-xl border border-border/60 bg-card/30 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Files
                </span>
                {selectedFile && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 text-xs">
                <FileTreeNode
                  node={result.fileTree}
                  findingsByFile={result.groupedFindings?.byFile || {}}
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </div>
            </div>
          )}

          {/* FINDINGS LIST — center column */}
          <div className="flex-1 min-w-0">
            {/* Group mode tabs */}
            <div className="flex items-center gap-1 mb-4 bg-secondary/30 rounded-lg p-1 w-fit">
              {GROUP_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setGroupMode(m.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    groupMode === m.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              {selectedFile && (
                <span className="ml-2 text-[10px] text-muted-foreground font-mono truncate max-w-40">
                  → {selectedFile.split('/').pop()}
                </span>
              )}
            </div>

            {/* Empty state */}
            {!hasFindings && (
              <div className="text-center py-20 px-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No secrets detected</h3>
                <p className="text-muted-foreground text-sm">
                  SecretShield scanned {stats.filesScanned ?? 0} files and found no exposed credentials.
                </p>
              </div>
            )}

            {fileFindings.length === 0 && selectedFile && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No findings in <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{selectedFile}</code>
              </div>
            )}

            {/* Grouped findings */}
            {(selectedFile ? [] : grouped).map(group => (
              <div key={group.key} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className={`text-sm font-bold ${group.cfg.color}`}>{group.label}</h3>
                  <span className="text-xs text-muted-foreground">({group.items.length})</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((finding, i) => (
                    <FindingCard
                      key={finding.fingerprint || i}
                      finding={finding}
                      selected={selectedFinding?.fingerprint === finding.fingerprint}
                      onSelect={(f) => { setSelectedFinding(f); setShowDetail(true); }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* File-filtered findings */}
            {selectedFile && fileFindings.length > 0 && (
              <div className="space-y-2">
                {fileFindings.map((finding, i) => (
                  <FindingCard
                    key={finding.fingerprint || i}
                    finding={finding}
                    selected={selectedFinding?.fingerprint === finding.fingerprint}
                    onSelect={(f) => { setSelectedFinding(f); setShowDetail(true); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* DETAIL PANEL — right column */}
          {showDetail && selectedFinding && (
            <div className="w-80 flex-shrink-0 rounded-xl border border-border/60 bg-card/30 overflow-hidden flex flex-col">
              <FindingDetailPanel
                finding={selectedFinding}
                onClose={() => { setShowDetail(false); setSelectedFinding(null); }}
              />
            </div>
          )}
        </div>

        {/* Errors / warnings */}
        {result.errors && result.errors.length > 0 && (
          <div className="mt-8 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warnings</div>
            {result.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {err}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
