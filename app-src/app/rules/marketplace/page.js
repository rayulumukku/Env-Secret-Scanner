'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers, Filter, ArrowLeft, Download, CheckCircle2,
  Lock, Shield, Terminal, BookOpen, ExternalLink,
  Tag, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RuleMarketplacePage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPack, setSelectedPack] = useState(null);
  const [installingId, setInstallingId] = useState(null);
  const [installedMap, setInstalledMap] = useState({});

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rules/packs');
      const data = await res.json();
      if (data.data?.installed) {
        setPacks(data.data.installed);
        const map = {};
        for (const p of data.data.installed) {
          map[p.id] = p.enabled;
        }
        setInstalledMap(map);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePack = async (packId, currentStatus) => {
    setInstallingId(packId);
    try {
      if (currentStatus) {
        // Disable
        await fetch(`/api/rules/packs/${packId}`, { method: 'DELETE' });
        setInstalledMap(prev => ({ ...prev, [packId]: false }));
      } else {
        // Install / Enable
        await fetch('/api/rules/packs/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: packId }),
        });
        setInstalledMap(prev => ({ ...prev, [packId]: true }));
      }
      loadPacks();
    } catch {
    } finally {
      setInstallingId(null);
    }
  };

  const categories = [
    'ALL', 'Cloud', 'AI', 'Source Control', 'Payments',
    'Communication', 'Databases', 'Infrastructure', 'CI/CD',
    'Authentication', 'Private Keys', 'Tokens', 'Generic Secrets'
  ];

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/rules">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rules Overview
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  RULE ECOSYSTEM
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Verified Declarative Packs</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Rule Pack Marketplace & Catalog
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Browse verified first-party, community-contributed, and enterprise compliance rule packs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/rules/lab">
                <Button variant="outline" size="sm" className="text-xs">
                  Testing Lab
                </Button>
              </Link>
              <Link href="/rules/community">
                <Button size="sm" className="text-xs bg-primary text-primary-foreground">
                  Submit Pack
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Packs Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {packs.map(pack => {
            const isInstalled = installedMap[pack.id];
            return (
              <div
                key={pack.id}
                className="rounded-2xl border border-border/70 bg-card/50 p-6 flex flex-col justify-between space-y-5 hover:border-primary/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        pack.isBuiltin
                          ? 'border-primary/40 text-primary bg-primary/5'
                          : 'border-blue-500/40 text-blue-400 bg-blue-500/5'
                      }`}
                    >
                      {pack.isBuiltin ? 'OFFICIAL CORE' : 'VERIFIED COMMUNITY'}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      v{pack.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {pack.name}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pack.description}
                  </p>

                  <div className="pt-2 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{pack.ruleCount} detection rules</span>
                    <span>•</span>
                    <span>{pack.license}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isInstalled ? 'secondary' : 'default'}
                      size="sm"
                      disabled={installingId === pack.id || (pack.id === 'core-rules' && isInstalled)}
                      onClick={() => handleTogglePack(pack.id, isInstalled)}
                      className={`flex-1 text-xs font-bold ${
                        !isInstalled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                      }`}
                    >
                      {pack.id === 'core-rules'
                        ? 'Built-in (Always Active)'
                        : isInstalled
                        ? 'Active (Uninstall)'
                        : 'Install Rule Pack'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPack(pack)}
                      className="text-xs px-2.5"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CLI Integration Tip */}
        <div className="rounded-2xl border border-border/70 bg-[oklch(0.08_0.005_240)] p-6 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Terminal className="w-4 h-4" />
            <span>Install & Manage via CLI</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            You can also install, inspect, and lock rule packs offline using the SecretShield CLI:
          </p>
          <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-foreground space-y-1">
            <p className="text-emerald-400">$ secretshield rules install community-rules</p>
            <p className="text-muted-foreground">$ secretshield rules list</p>
            <p className="text-muted-foreground">$ secretshield rules test aws-access-key-id</p>
          </div>
        </div>
      </div>

      {/* Pack Details Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="text-xs text-primary mb-1">
                  Rule Pack Specification
                </Badge>
                <h2 className="text-xl font-bold text-foreground">{selectedPack.name}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  ID: {selectedPack.id} · Author: {selectedPack.author}
                </p>
              </div>
              <button
                onClick={() => setSelectedPack(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedPack.description}
            </p>

            <div className="bg-secondary/20 p-3 rounded-xl border border-border/50 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="text-foreground font-bold">{selectedPack.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License:</span>
                <span className="text-foreground">{selectedPack.license}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Integrity:</span>
                <span className="text-primary truncate max-w-xs">{selectedPack.integrity || 'Verified'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedPack(null)}>
                Close
              </Button>
              <Link href="/docs/rules">
                <Button size="sm" className="bg-primary text-primary-foreground text-xs">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
