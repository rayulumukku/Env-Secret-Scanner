'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2, Plus, Shield, ArrowUpRight, Search,
  AlertTriangle, CheckCircle2, Clock, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations/active/projects')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setProjects(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    !query ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Organize repositories, custom policies, scans, and secret remediation pipelines
            </p>
          </div>

          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects by name or description…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-xs text-foreground outline-none transition-all"
          />
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <FolderGit2 className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground mb-1">
              {query ? 'No matching projects found' : 'No projects created yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
              Projects group related repositories, custom rules, baselines, and team findings.
            </p>
            <Link href="/projects/new">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground">
                <Plus className="w-3.5 h-3.5" />
                Create New Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => {
              const openCount = p.stats?.openFindings || 0;
              const criticalCount = p.stats?.criticalCount || 0;
              const score = p.stats?.securityHealth?.score ?? 100;

              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group block rounded-2xl border border-border/60 bg-card/40 p-5 hover:border-primary/40 hover:bg-card/70 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <FolderGit2 className="w-4.5 h-4.5" />
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      score >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {score}% Health
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="border-t border-border/40 mt-4 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{p.repositories?.length || 0} Repositories</span>

                    {criticalCount > 0 ? (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} Critical
                      </span>
                    ) : openCount > 0 ? (
                      <span className="text-yellow-400 font-semibold">{openCount} Findings</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
