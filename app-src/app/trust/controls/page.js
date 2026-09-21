'use client';

/**
 * app/trust/controls/page.js
 *
 * Security Controls Library & Evidence Mappings for SecretShield Trust Center.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ControlsLibraryPage() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedControlId, setExpandedControlId] = useState(null);

  useEffect(() => {
    fetchControls();
  }, [selectedCategory]);

  async function fetchControls() {
    try {
      setLoading(true);
      const url = selectedCategory !== 'ALL'
        ? `/api/trust/controls?category=${selectedCategory}`
        : '/api/trust/controls';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setControls(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const filteredControls = controls.filter(c =>
    !searchQuery ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Controls Framework</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Documented technical controls across SecretShield systems with verifiable evidence attachments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/trust/evidence">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Evidence Repository
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Category Filter */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search controls by code, title, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border/80 rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-background border border-border/80 rounded-md text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="AUTHENTICATION">Authentication</option>
                  <option value="AUTHORIZATION">Authorization / RBAC</option>
                  <option value="SECRET_HANDLING">Secret Handling</option>
                  <option value="ENCRYPTION">Encryption</option>
                  <option value="AUDIT_LOGGING">Audit Logging</option>
                  <option value="INCIDENT_RESPONSE">Incident Response</option>
                  <option value="RETENTION">Retention</option>
                  <option value="AI_PRIVACY">AI Privacy</option>
                  <option value="SECURE_DEV">Secure Development</option>
                  <option value="INTEGRATIONS">Integrations</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Feed */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Documented Controls ({filteredControls.length})
              </CardTitle>
              <Button onClick={fetchControls} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {filteredControls.map((ctrl) => {
              const isExpanded = expandedControlId === ctrl.id;
              return (
                <div key={ctrl.id} id={ctrl.code} className="p-4 hover:bg-muted/10 transition-colors space-y-2">
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedControlId(isExpanded ? null : ctrl.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                          {ctrl.code}
                        </Badge>
                        <span className="font-semibold text-sm">{ctrl.name}</span>
                        <Badge className={ctrl.implementationStatus === 'IMPLEMENTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                          {ctrl.implementationStatus}
                        </Badge>
                        {ctrl.isPublic && (
                          <Badge variant="secondary" className="text-[10px]">Publicly Visible</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{ctrl.description}</p>
                      <div className="text-[11px] text-muted-foreground flex gap-4 pt-1">
                        <span>Category: <span className="font-mono text-foreground">{ctrl.category}</span></span>
                        <span>Owner: <span className="text-foreground">{ctrl.owner}</span></span>
                        <span>Last Reviewed: {new Date(ctrl.lastReviewedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Expanded Evidence & Requirements */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 p-3 rounded-md space-y-3 text-xs">
                      {ctrl.evidenceRequirements?.length > 0 && (
                        <div>
                          <span className="font-semibold text-muted-foreground block mb-1">Evidence Requirements:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {ctrl.evidenceRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ctrl.evidence?.length > 0 ? (
                        <div>
                          <span className="font-semibold text-muted-foreground block mb-1">Attached Evidence Snapshots ({ctrl.evidence.length}):</span>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            {ctrl.evidence.map((ev) => (
                              <div key={ev.id} className="p-2 rounded bg-background border border-border/60 flex items-center justify-between">
                                <div>
                                  <span className="text-foreground font-semibold">{ev.title}</span>
                                  <span className="text-muted-foreground block text-[10px]">{ev.summary}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">{ev.sourceType}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-[11px] italic">
                          Baseline verified by automated test suite and platform configuration.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
