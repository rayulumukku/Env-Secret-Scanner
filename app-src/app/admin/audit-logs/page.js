'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock, ArrowLeft, RefreshCw, ShieldCheck,
  AlertTriangle, Filter, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Global Admin
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                  GOVERNANCE & AUDITING
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {logs.length} Recorded Admin Events
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Global Security Audit Log
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Immutable record of platform-level administrative changes, flag toggles, and maintenance triggers.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              All audit log parameters are strictly sanitized. Token strings, passwords, and user code are stripped prior to write.
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            IMMUTABLE LOG
          </Badge>
        </div>

        {/* Logs Table */}
        <div className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-mono">
                  <th className="p-3.5 font-semibold">Timestamp</th>
                  <th className="p-3.5 font-semibold">Actor</th>
                  <th className="p-3.5 font-semibold">Action</th>
                  <th className="p-3.5 font-semibold">Target / Details</th>
                  <th className="p-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary mb-2" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">
                      No administrative audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map(log => (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-foreground font-semibold">
                        {log.actorEmail || log.actorId || 'system'}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted-foreground truncate max-w-xs font-sans text-xs">
                        {log.details ? JSON.stringify(log.details) : log.target || '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
