'use client';

/**
 * app/security/events/page.js
 *
 * Continuous Security Operations Event Stream for SecretShield.
 * Displays normalized, auditable security events with multi-factor filtering.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedSeverity]);

  async function fetchEvents() {
    try {
      setLoading(true);
      let url = '/api/security/events?limit=50';
      if (selectedType !== 'ALL') url += `&eventType=${selectedType}`;
      if (selectedSeverity !== 'ALL') url += `&severity=${selectedSeverity}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      e.eventType?.toLowerCase().includes(q) ||
      e.actor?.toLowerCase().includes(q) ||
      e.repositoryId?.toLowerCase().includes(q) ||
      e.source?.toLowerCase().includes(q) ||
      e.relatedFingerprints?.some(fp => fp.toLowerCase().includes(q))
    );
  });

  function getSeverityBadge(sev) {
    switch (sev) {
      case 'CRITICAL':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">LOW</Badge>;
      default:
        return <Badge variant="outline">INFO</Badge>;
    }
  }

  function getEventIcon(type) {
    switch (type) {
      case 'SECRET_DETECTED':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'SECRET_REINTRODUCED':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      case 'REMEDIATION_VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'POLICY_VIOLATION':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-primary" />;
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
                  <Activity className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Operations Engine</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Continuous Security Events</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Real-time, auditable event stream tracking secret introductions, policy evaluations, and verification loops.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchEvents} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/security/automation">
                <Button size="sm" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Automation Queue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Controls */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by event type, actor, repo, or fingerprint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border/80 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-background border border-border/80 rounded-md text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="SECRET_DETECTED">SECRET_DETECTED</option>
                  <option value="SECRET_REINTRODUCED">SECRET_REINTRODUCED</option>
                  <option value="POLICY_VIOLATION">POLICY_VIOLATION</option>
                  <option value="REMEDIATION_VERIFIED">REMEDIATION_VERIFIED</option>
                  <option value="SCAN_COMPLETED">SCAN_COMPLETED</option>
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 bg-background border border-border/80 rounded-md text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Table / Feed */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Event Log ({filteredEvents.length})
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Showing newest events first • Auto-correlated
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Streaming security events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-medium">No Security Events Recorded</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No events match the selected criteria. Continuous protection pipeline is operational.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredEvents.map((evt) => {
                  const isExpanded = expandedEventId === evt.id;
                  return (
                    <div key={evt.id} className="p-4 hover:bg-muted/10 transition-colors">
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="p-2 rounded-md bg-muted border border-border/60 mt-0.5">
                            {getEventIcon(evt.eventType)}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-foreground">
                                {evt.eventType}
                              </span>
                              {getSeverityBadge(evt.severity)}
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {evt.source}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Actor: <span className="text-foreground">{evt.actor || 'System'}</span></span>
                              {evt.repositoryId && (
                                <span>Repo: <span className="text-foreground font-mono">{evt.repositoryId}</span></span>
                              )}
                              <span>Time: {new Date(evt.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {evt.relatedFingerprints?.length > 0 && (
                            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
                              {evt.relatedFingerprints.length} Fingerprint(s)
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 p-3 rounded-md space-y-3 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                            <div>
                              <span className="text-muted-foreground block">Event ID:</span>
                              <span className="text-foreground">{evt.id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Correlation ID:</span>
                              <span className="text-foreground">{evt.correlationId || 'N/A'}</span>
                            </div>
                          </div>

                          {evt.relatedFingerprints?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-semibold block mb-1">Associated Masked Fingerprints:</span>
                              <div className="flex flex-wrap gap-2">
                                {evt.relatedFingerprints.map((fp) => (
                                  <Link key={fp} href={`/exposure/${fp}`}>
                                    <Badge variant="outline" className="font-mono hover:border-primary cursor-pointer gap-1">
                                      {fp.slice(0, 16)}...
                                      <ExternalLink className="w-3 h-3 text-primary" />
                                    </Badge>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-semibold block mb-1">Structured Context:</span>
                              <pre className="p-2 rounded bg-background border border-border/60 overflow-x-auto text-[11px] text-muted-foreground">
                                {JSON.stringify(evt.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
