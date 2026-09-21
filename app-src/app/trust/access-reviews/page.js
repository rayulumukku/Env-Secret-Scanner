'use client';

/**
 * app/trust/access-reviews/page.js
 *
 * Periodic Access Reviews & Identity Governance Center for SecretShield.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  Search,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AccessReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const url = selectedStatus !== 'ALL'
        ? `/api/trust/access-reviews?status=${selectedStatus}`
        : '/api/trust/access-reviews';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewAction(id, verdict) {
    try {
      setActionLoading(id);
      await fetch(`/api/trust/access-reviews/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict, notes: `Reviewed via Trust Center (${verdict})` }),
      });
      await fetchReviews();
    } catch {
      // fallback
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">PENDING</Badge>;
      case 'REVIEWED':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">REVIEWED</Badge>;
      case 'REVOKED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">REVOKED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/trust" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Trust Center
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Periodic Access Reviews</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Quarterly access governance for members, administrative roles, repository permissions, and API credentials.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchReviews} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Filter */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'REVIEWED', 'REVOKED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedStatus === st
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-card border border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Reviews Feed */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <CardTitle className="text-base font-semibold">
              Access Review Items ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {reviews.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-medium">Zero Pending Access Reviews</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All member roles and integration permissions are up to date.
                </p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{r.targetName}</span>
                      {getStatusBadge(r.status)}
                      <Badge variant="outline" className="text-[10px] font-mono">{r.targetType}</Badge>
                      <Badge variant="secondary" className="text-[10px]">Role: {r.currentRole}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-4 pt-0.5">
                      <span>Target ID: <span className="font-mono text-foreground">{r.targetId}</span></span>
                      {r.reviewedBy && <span>Reviewer: <span className="text-foreground">{r.reviewedBy}</span></span>}
                      {r.reviewedAt && <span>Reviewed: {new Date(r.reviewedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        disabled={actionLoading === r.id}
                        onClick={() => handleReviewAction(r.id, 'REVIEWED')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm Access
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        disabled={actionLoading === r.id}
                        onClick={() => handleReviewAction(r.id, 'REVOKED')}
                      >
                        <X className="w-3.5 h-3.5" />
                        Revoke Access
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
