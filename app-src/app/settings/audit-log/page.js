'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, Shield, User, Clock, Filter,
  RefreshCw, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  async function loadAuditLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);

    try {
      const res = await fetch(`/api/audit-log?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Security Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Immutable timeline of authentication, scans, rule updates, and team actions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            className="gap-1.5 text-xs border-border/60 hover:bg-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 rounded-2xl border border-border/60 bg-card/40 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-primary" /> Filter Events:
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border/60 bg-secondary/30 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="">All Security Events</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="USER_REGISTERED">User Registrations</option>
            <option value="SCAN_COMPLETED">Scans Completed</option>
            <option value="FINDING_STATUS_CHANGED">Finding Status Updates</option>
            <option value="RULE_CREATED">Custom Rules Created</option>
            <option value="MEMBER_INVITED">Member Invitations</option>
            <option value="MEMBER_ROLE_CHANGED">Member Role Changes</option>
            <option value="WEBHOOK_CREATED">Webhooks Created</option>
          </select>
        </div>

        {/* Audit Log Timeline Table */}
        {logs.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <Activity className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground">No audit logs recorded yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Security events will appear automatically as team members perform scans and actions.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>

                      <td className="p-3.5 font-medium text-foreground">
                        {l.userEmail || 'System'}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-primary/10 text-primary border border-primary/20">
                          {l.action}
                        </span>
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {l.targetType} {l.targetId ? `(${l.targetId.slice(0, 10)})` : ''}
                      </td>

                      <td className="p-3.5 font-mono text-muted-foreground">
                        {l.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
