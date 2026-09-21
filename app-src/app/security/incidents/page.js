'use client';

/**
 * app/security/incidents/page.js
 *
 * Incident Bundling & Security Investigation Hub for SecretShield.
 * Bundles correlated exposure clusters and events into structured security investigations.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');

  useEffect(() => {
    fetchIncidents();
  }, [selectedStatus]);

  async function fetchIncidents() {
    try {
      setLoading(true);
      const url = selectedStatus !== 'ALL'
        ? `/api/security/incidents?status=${selectedStatus}`
        : '/api/security/incidents';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateIncident(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          severity: newSeverity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setIsCreating(false);
        await fetchIncidents();
      }
    } catch {
      // fallback
    }
  }

  const filteredIncidents = incidents.filter(i =>
    !searchQuery ||
    i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getStatusBadge(status) {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">OPEN</Badge>;
      case 'INVESTIGATING':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">INVESTIGATING</Badge>;
      case 'REMEDIATION':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">REMEDIATION</Badge>;
      case 'VERIFYING':
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">VERIFYING</Badge>;
      case 'CLOSED':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">CLOSED</Badge>;
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
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Incident Response</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Incidents & Investigations</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Grouped exposure clusters, chronological audit trails, sanitized investigation notes, and remediation tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setIsCreating(!isCreating)} className="gap-2">
                <Plus className="w-4 h-4" />
                Bundle Incident
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Create Form Modal */}
        {isCreating && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="py-4 border-b border-primary/20">
              <CardTitle className="text-base font-semibold">Bundle New Incident</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Incident Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Compromised Staging Database Credential Cluster"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Initial Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" size="sm">Create Incident</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search incidents by title or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border/80 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-background border border-border/80 rounded-md text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="REMEDIATION">REMEDIATION</option>
                  <option value="VERIFYING">VERIFYING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident List */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Active Incidents ({filteredIncidents.length})
              </CardTitle>
              <Button onClick={fetchIncidents} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-medium">Zero Active Incidents</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No security incidents match the current filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredIncidents.map((inc) => (
                  <div key={inc.id} className="p-4 hover:bg-muted/10 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/security/incidents/${inc.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                          {inc.title}
                        </Link>
                        {getStatusBadge(inc.status)}
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {inc.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-4 pt-1">
                        <span>ID: <span className="font-mono text-foreground">{inc.id}</span></span>
                        <span>Clusters: <span className="font-mono text-foreground">{inc.clustersCount || 1}</span></span>
                        <span>Created: {new Date(inc.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <Link href={`/security/incidents/${inc.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Investigate
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
