'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare, AlertCircle, ShieldAlert, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, AlertTriangle, Clock,
  Check, X, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (data.data) {
        setFeedbackList(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedbackList(prev =>
          prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
        );
      }
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = feedbackList.filter(item => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
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
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  ADMIN TRIAGE
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {feedbackList.length} Total Submissions
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Product Feedback & Detection Triage
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Review community suggestions, false positive reports, and missed secret disclosures.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadFeedback}
              disabled={loading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-card/40 p-4 rounded-xl border border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Category:</span>
          </div>
          {['ALL', 'GENERAL', 'FALSE_POSITIVE', 'FALSE_NEGATIVE', 'FEATURE_REQUEST', 'BUG'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}

          <div className="w-px h-4 bg-border/60 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">Status:</span>
          </div>
          {['ALL', 'OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            Loading submissions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/70 rounded-2xl space-y-2 bg-card/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">No Feedback in Current View</h3>
            <p className="text-xs text-muted-foreground">
              No submissions match the selected filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-border/70 bg-card/50 space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-xs font-mono ${
                        item.category === 'FALSE_POSITIVE'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          : item.category === 'FALSE_NEGATIVE'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-primary/10 text-primary border-primary/30'
                      }`}
                    >
                      {item.category.replace('_', ' ')}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        item.status === 'RESOLVED'
                          ? 'text-emerald-400 border-emerald-500/40'
                          : item.status === 'REVIEWED'
                          ? 'text-blue-400 border-blue-500/40'
                          : item.status === 'DISMISSED'
                          ? 'text-muted-foreground border-border'
                          : 'text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {item.status}
                    </Badge>

                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {item.status !== 'REVIEWED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'REVIEWED')}
                        className="text-[11px] h-7 px-2.5"
                      >
                        Mark Reviewed
                      </Button>
                    )}
                    {item.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                        className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Resolve
                      </Button>
                    )}
                    {item.status !== 'DISMISSED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'DISMISSED')}
                        className="text-[11px] h-7 px-2 text-muted-foreground hover:text-red-400"
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 text-xs leading-relaxed">
                  {item.ruleId && (
                    <div className="font-mono text-muted-foreground">
                      Target Rule: <span className="text-foreground font-semibold">{item.ruleId}</span>
                    </div>
                  )}

                  {item.maskedSnippet && (
                    <div className="bg-background/80 p-3 rounded-lg border border-border/50 font-mono text-[11px] text-amber-300">
                      <code>{item.maskedSnippet}</code>
                    </div>
                  )}

                  <p className="text-foreground text-sm">
                    {item.description || item.suggestion || item.message || 'No additional description provided.'}
                  </p>

                  {item.contactEmail && (
                    <p className="text-muted-foreground text-[11px]">
                      Reporter: <span className="text-foreground">{item.contactEmail}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
