'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Search, Filter, GitBranch, GitPullRequest,
  MessageSquare, Webhook, Terminal, CheckSquare, Shield,
  ArrowRight, CheckCircle2, Lock, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketplacePage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const json = await res.json();
      if (json.success) {
        setIntegrations(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const categories = [
    'ALL',
    'Source Control',
    'CI/CD',
    'Communication',
    'Issue Tracking',
    'Developer Tools',
    'Webhooks'
  ];

  const filtered = integrations.filter(item => {
    const matchesCat = category === 'ALL' || item.category === category;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function getProviderIcon(id) {
    switch (id) {
      case 'github':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      case 'gitlab':
        return <GitPullRequest className="w-5 h-5 text-orange-400" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 text-pink-400" />;
      case 'webhooks':
        return <Webhook className="w-5 h-5 text-cyan-400" />;
      case 'discord':
      case 'msteams':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'jira':
      case 'linear':
        return <CheckSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <Terminal className="w-5 h-5 text-slate-400" />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Ecosystem & Marketplace
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400" />
              SecretShield Integrations
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Connect your repositories, continuous integration pipelines, issue trackers, and team channels without exposing sensitive authorization tokens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/integrations">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Installed Integrations
              </Button>
            </Link>
            <Link href="/docs/integrations/building-an-integration">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                Integration SDK
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => {
            const isSupported = item.status === 'SUPPORTED';
            const isConnected = item.isConnected;

            return (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      {getProviderIcon(item.id)}
                    </div>
                    {isSupported ? (
                      isConnected ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> CONNECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                          READY TO CONNECT
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Coming later
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{item.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  {item.capabilities && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        Capabilities:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.capabilities.slice(0, 3).map(cap => (
                          <span
                            key={cap}
                            className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  {isSupported ? (
                    <Link href={`/integrations/${item.id}`} className="w-full">
                      <Button
                        size="sm"
                        className={`w-full text-xs font-semibold gap-1.5 ${
                          isConnected
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950'
                        }`}
                      >
                        {isConnected ? 'Manage Configuration' : 'Connect & View Permissions'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full text-center text-xs text-slate-500 font-mono py-1.5 bg-slate-950/40 rounded-lg border border-slate-800/60">
                      Planned for future release
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
