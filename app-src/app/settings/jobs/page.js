'use client';

/**
 * app/settings/jobs/page.js
 *
 * Background Job Queue Monitoring & Administration.
 *
 * SAFETY GUARANTEES:
 *   - Zero raw secrets displayed in job payloads or error messages.
 *   - Only permits actions on registered, pre-defined jobs (retry/cancel).
 *   - Disallows executing arbitrary user code.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListTodo, ArrowLeft, RefreshCw, CheckCircle2, Clock,
  AlertTriangle, XCircle, RotateCcw, Ban, Filter, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function JobsMonitoringPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      }
    } catch {
      toast({
        title: 'Error loading jobs',
        description: 'Could not fetch background job queue.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, typeFilter]);

  const handleRetry = async (jobId) => {
    setActionInProgress(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Job re-enqueued', description: `Job ${jobId} was queued for retry.` });
        fetchJobs();
      } else {
        toast({ title: 'Retry failed', description: data.error?.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Retry error', description: 'Could not reach server.', variant: 'destructive' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (jobId) => {
    setActionInProgress(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Job cancelled', description: `Job ${jobId} was cancelled.` });
        fetchJobs();
      } else {
        toast({ title: 'Cancel failed', description: data.error?.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Cancel error', description: 'Could not reach server.', variant: 'destructive' });
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Processing</Badge>;
      case 'QUEUED':
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> Queued</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-neutral-500/15 text-neutral-400 border-neutral-500/30 gap-1"><Ban className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Background Job Queue</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time queue monitoring, execution metrics, and worker administration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={fetchJobs}
              disabled={loading}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Job Types</option>
            <option value="SCAN_PUSH">SCAN_PUSH</option>
            <option value="SCAN_PR">SCAN_PR</option>
            <option value="GITHUB_CHECK">GITHUB_CHECK</option>
            <option value="NOTIFICATIONS">NOTIFICATIONS</option>
            <option value="WEBHOOK_DISPATCH">WEBHOOK_DISPATCH</option>
          </select>
        </div>

        {/* Job Table */}
        <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
          {jobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Cpu className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground">No Background Jobs Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Jobs will appear here as repository scans, webhooks, and asynchronous tasks execute.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 border-b border-border/40 text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Job ID</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Attempts</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-card/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">{job.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-secondary text-primary font-mono text-[11px]">
                          {job.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {job.durationMs > 0 ? `${job.durationMs}ms` : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {job.attempts} / {job.maxRetries}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {job.status === 'QUEUED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(job.id)}
                            disabled={actionInProgress === job.id}
                            className="h-7 text-[11px] text-amber-400 hover:text-amber-300"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {(job.status === 'FAILED' || job.status === 'CANCELLED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(job.id)}
                            disabled={actionInProgress === job.id}
                            className="h-7 text-[11px] text-primary hover:text-primary/90"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
