'use client';

import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { FindingDetail } from './FindingDetail';
import {
  ChevronUp, ChevronDown, Search, Filter,
  CheckCircle2, EyeOff, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * Main findings table with sort, filter, and detail panel.
 */
export function FindingsTable({ findings = [], isDemo = false, onMarkFalsePositive, onIgnorePattern }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('severity');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...findings];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.type?.toLowerCase().includes(q) ||
        f.file?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    if (filterSeverity !== 'ALL') {
      result = result.filter(f => f.severity === filterSeverity);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'severity') {
        cmp = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
      } else if (sortField === 'confidence') {
        cmp = b.confidence - a.confidence;
      } else if (sortField === 'file') {
        cmp = (a.file || '').localeCompare(b.file || '');
      } else if (sortField === 'line') {
        cmp = (a.line || 0) - (b.line || 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [findings, search, filterSeverity, sortField, sortDir]);

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-16 text-center">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-foreground font-medium">No findings detected</p>
        <p className="text-muted-foreground text-sm mt-1">All checks passed successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search findings…"
            className="pl-9 h-8 text-sm bg-secondary/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={cn(
                'text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide border transition-colors',
                filterSeverity === sev
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent bg-secondary/30">
              <TableHead className="w-24">
                <button onClick={() => toggleSort('severity')} className="flex items-center gap-1 text-xs font-semibold">
                  Severity <SortIcon field="severity" />
                </button>
              </TableHead>
              <TableHead className="min-w-40">Secret Type</TableHead>
              <TableHead>
                <button onClick={() => toggleSort('file')} className="flex items-center gap-1 text-xs font-semibold">
                  File <SortIcon field="file" />
                </button>
              </TableHead>
              <TableHead className="w-16">
                <button onClick={() => toggleSort('line')} className="flex items-center gap-1 text-xs font-semibold">
                  Line <SortIcon field="line" />
                </button>
              </TableHead>
              <TableHead className="w-28">
                <button onClick={() => toggleSort('confidence')} className="flex items-center gap-1 text-xs font-semibold">
                  Confidence <SortIcon field="confidence" />
                </button>
              </TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((finding, idx) => (
              <TableRow
                key={finding.fingerprint || idx}
                className={cn(
                  'border-border/50 cursor-pointer transition-colors',
                  selectedFinding?.fingerprint === finding.fingerprint
                    ? 'bg-primary/5 border-primary/20'
                    : 'hover:bg-secondary/30'
                )}
                onClick={() => setSelectedFinding(finding)}
              >
                <TableCell>
                  <SeverityBadge severity={finding.severity} />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">{finding.name}</p>
                    <p className="text-xs text-muted-foreground">{finding.category}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {finding.file || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground">
                    :{finding.line || '?'}
                  </span>
                </TableCell>
                <TableCell>
                  <ConfidenceMeter confidence={finding.confidence} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={e => { e.stopPropagation(); setSelectedFinding(finding); }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length < findings.length && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {findings.length} findings
        </p>
      )}

      {/* Detail panel */}
      {selectedFinding && (
        <FindingDetail
          finding={selectedFinding}
          isDemo={isDemo}
          onClose={() => setSelectedFinding(null)}
          onMarkFalsePositive={() => {
            onMarkFalsePositive?.(selectedFinding);
            setSelectedFinding(null);
          }}
          onIgnorePattern={() => {
            onIgnorePattern?.(selectedFinding);
            setSelectedFinding(null);
          }}
        />
      )}
    </div>
  );
}
