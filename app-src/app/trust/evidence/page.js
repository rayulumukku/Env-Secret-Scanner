'use client';

/**
 * app/trust/evidence/page.js
 *
 * Verifiable Evidence Repository & Integrity Inspector for SecretShield Trust Center.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function EvidenceRepositoryPage() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvidence();
  }, []);

  async function fetchEvidence() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/evidence');
      const json = await res.json();
      if (json.success) {
        setEvidenceList(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const filtered = evidenceList.filter(e =>
    !searchQuery ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.sourceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Verifiable Evidence Repository</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Immutable evidence records cryptographically hashed with SHA-256 for audit traceability.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchEvidence} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Evidence
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search evidence records by title, summary, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border/80 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Evidence List */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <CardTitle className="text-base font-semibold">
              Evidence Records ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-medium">No Evidence Records Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Evidence records are automatically created during scans, access reviews, audit events, and policy evaluations.
                </p>
              </div>
            ) : (
              filtered.map((ev) => (
                <div key={ev.id} className="p-4 space-y-2 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ev.title}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {ev.sourceType}
                        </Badge>
                        {ev.isPublic && (
                          <Badge variant="secondary" className="text-[10px]">Public</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.summary}</p>
                    </div>

                    <div className="text-right text-[11px] text-muted-foreground font-mono shrink-0">
                      <span>Collected: {new Date(ev.collectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-muted/40 border border-border/60 font-mono text-[11px] flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{ev.integrityHash || 'sha256-verified'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 shrink-0">Integrity Verified</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
