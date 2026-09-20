'use client';

/**
 * app/security/graph/page.js
 *
 * Interactive Repository Exposure & Attack-Path Graph Explorer for SecretShield.
 *
 * Visualizes evidence-backed relationships across:
 * Organization -> Project -> Repository -> Branch -> Commit -> File -> Finding -> Rule -> Remediation
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Network,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Database,
  GitBranch,
  GitCommit,
  FileCode,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ExposureGraphPage() {
  const searchParams = useSearchParams();
  const initialFingerprint = searchParams?.get('fingerprint') || '';

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [maxDepth, setMaxDepth] = useState(4);
  const [searchFilter, setSearchFilter] = useState(initialFingerprint);

  useEffect(() => {
    loadGraphData();
  }, [maxDepth, searchFilter]);

  async function loadGraphData() {
    try {
      setLoading(true);
      const url = searchFilter
        ? `/api/security/graph/${searchFilter}`
        : `/api/security/graph?maxDepth=${maxDepth}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGraphData(data.data);
        if (data.data.nodes?.length > 0 && !selectedNode) {
          setSelectedNode(data.data.nodes[0]);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Group nodes by depth for hierarchical layered visualization
  const depthGroups = [0, 1, 2, 3, 4].map(d => ({
    depth: d,
    title: getDepthTitle(d),
    nodes: nodes.filter(n => n.depth === d),
  }));

  function getDepthTitle(d) {
    switch (d) {
      case 0: return 'Organization Scope';
      case 1: return 'Projects';
      case 2: return 'Repositories';
      case 3: return 'Branches & Commits';
      case 4: return 'Files, Findings & Rules';
      default: return `Tier ${d}`;
    }
  }

  function getNodeIcon(type) {
    switch (type) {
      case 'ORGANIZATION': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'PROJECT': return <Layers className="w-4 h-4 text-blue-400" />;
      case 'REPOSITORY': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'BRANCH': return <GitBranch className="w-4 h-4 text-cyan-400" />;
      case 'COMMIT': return <GitCommit className="w-4 h-4 text-indigo-400" />;
      case 'FILE': return <FileCode className="w-4 h-4 text-muted-foreground" />;
      case 'FINDING': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'RULE': return <Network className="w-4 h-4 text-amber-400" />;
      case 'REMEDIATION': return <RotateCcw className="w-4 h-4 text-teal-400" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <Network className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Attack-Path & Dependency Graph</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Repository Exposure Graph</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Evidence-backed directed acyclic graph mapping organization assets, git commits, source files, detected secrets, and verified remediation paths.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/exposure">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                  Exposure Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Factual Credential Notice */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
            <span><strong>Factual Policy:</strong> Credential validity not verified. Graph relationships represent confirmed repository, commit, and file associations with explicit evidence.</span>
          </div>
          <span className="text-[11px] font-mono hidden sm:inline">Bounded Traversal (Depth &le; {maxDepth})</span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Focus graph by fingerprint (e.g. aws_...)"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg border border-border/70 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Traversal Depth:</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map(depth => (
                <button
                  key={depth}
                  onClick={() => setMaxDepth(depth)}
                  className={`w-7 h-7 text-xs font-mono font-semibold rounded-md transition-colors ${
                    maxDepth === depth
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {depth}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Graph Layout & Inspector */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Graph Canvas Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border/70 overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  Exposure Dependency Topology ({nodes.length} Nodes, {edges.length} Edges)
                </CardTitle>
                <span className="text-[11px] font-mono text-muted-foreground">Click node to inspect evidence</span>
              </CardHeader>

              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-20">
                    <Network className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
                    <p className="text-xs text-muted-foreground font-mono">Tracing evidence graph dependencies...</p>
                  </div>
                ) : nodes.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground">Clean Dependency Topology</h3>
                    <p className="text-xs text-muted-foreground mt-1">No active secrets found in the graph scope.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {depthGroups.filter(g => g.nodes.length > 0).map(group => (
                      <div key={group.depth} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                            {group.title}
                          </span>
                          <div className="h-px bg-border/60 flex-1" />
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {group.nodes.map(node => {
                            const isSelected = selectedNode?.id === node.id;
                            return (
                              <button
                                key={node.id}
                                onClick={() => setSelectedNode(node)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border text-left ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                                    : 'border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-border'
                                }`}
                              >
                                {getNodeIcon(node.type)}
                                <span className="font-medium text-foreground truncate max-w-[200px]">{node.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Node Inspector Panel */}
          <div className="space-y-4">
            <Card className="bg-card border-border/70 sticky top-6">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Node Inspector & Evidence Source
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                          {selectedNode.type}
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground">Tier {selectedNode.depth}</span>
                      </div>
                      <h3 className="text-sm font-bold font-mono text-foreground break-all">{selectedNode.label}</h3>
                    </div>

                    {/* Node Attributes */}
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs">
                      <div className="font-semibold text-foreground border-b border-border/40 pb-1">Properties</div>
                      {Object.entries(selectedNode.data || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between font-mono text-[11px] gap-2">
                          <span className="text-muted-foreground">{k}:</span>
                          <span className="text-foreground truncate max-w-[160px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Connected Evidence Edges */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-foreground">Verified Relationship Edges</div>
                      {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 ? (
                        <p className="text-[11px] text-muted-foreground font-mono">No direct adjacent edges in active scope.</p>
                      ) : (
                        <div className="space-y-2">
                          {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => (
                            <div key={e.id} className="p-2.5 rounded border border-border/60 bg-muted/10 text-[11px] space-y-1">
                              <div className="flex items-center justify-between font-mono font-medium">
                                <span className="text-primary">{e.relationshipType.replace(/_/g, ' ')}</span>
                                <span className="text-muted-foreground">{e.evidenceId}</span>
                              </div>
                              <p className="text-muted-foreground">{e.evidenceSource}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Navigation if Finding */}
                    {selectedNode.type === 'FINDING' && selectedNode.data?.fingerprint && (
                      <div className="pt-2">
                        <Link href={`/investigate/${selectedNode.data.fingerprint}`}>
                          <Button size="sm" className="w-full gap-2 text-xs">
                            Open Investigation Workspace
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Select a node in the graph topology to inspect verified evidence and relationships.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
