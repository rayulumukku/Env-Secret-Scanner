'use client';

/**
 * components/layout/CommandPalette.js
 *
 * Global keyboard-driven command palette (Cmd/Ctrl + K).
 * Provides rapid keyboard navigation, actions, search, and permission-aware routing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Shield, LayoutDashboard, AlertTriangle, CheckCircle2,
  Settings, BookOpen, GitBranch, PlusCircle, Terminal, Activity,
  Sliders, ArrowRight, X, ExternalLink
} from 'lucide-react';

const STATIC_COMMANDS = [
  {
    category: 'Navigation',
    items: [
      { id: 'dash', title: 'Dashboard', desc: 'View security overview & scan summary', href: '/dashboard', icon: LayoutDashboard },
      { id: 'scan', title: 'Scan Repository / Code', desc: 'Scan files, folders, or git repositories', href: '/scan', icon: Shield, badge: 'Core' },
      { id: 'findings', title: 'Security Findings', desc: 'Browse and triage detected secrets', href: '/findings', icon: AlertTriangle },
      { id: 'remediation', title: 'Remediation Center', desc: 'Resolve and ignore secret findings', href: '/remediation', icon: CheckCircle2 },
      { id: 'rules', title: 'Detection Rules & Lab', desc: 'Custom regex rules & test workbench', href: '/rules', icon: Sliders },
      { id: 'integrations', title: 'GitHub & GitLab Integrations', desc: 'Configure CI/CD and repository webhooks', href: '/integrations', icon: GitBranch },
    ],
  },
  {
    category: 'Quick Actions',
    items: [
      { id: 'act-scan', title: 'Run Interactive Demo', desc: 'Test secret detection with synthetic sample files', href: '/#demo', icon: Terminal },
      { id: 'act-proj', title: 'Create New Project', desc: 'Organize repositories into workspaces', href: '/projects', icon: PlusCircle },
      { id: 'act-rule', title: 'Test Custom Regex Rule', desc: 'Open interactive regex safety lab', href: '/rules/lab', icon: Sliders },
    ],
  },
  {
    category: 'System & Documentation',
    items: [
      { id: 'doc-home', title: 'Documentation Hub', desc: 'Read guides, API references, and tutorials', href: '/docs', icon: BookOpen },
      { id: 'doc-cli', title: 'CLI & Pre-commit Guide', desc: 'Learn local and automated git hook scanning', href: '/docs/cli', icon: Terminal },
      { id: 'status', title: 'System Status', desc: 'Check scanner API & service availability', href: '/status', icon: Activity },
      { id: 'settings', title: 'Platform Settings', desc: 'Manage profile, security, and preferences', href: '/settings', icon: Settings },
    ],
  },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);

  // Flattened filtered commands
  const filteredGroups = STATIC_COMMANDS.map(group => ({
    category: group.category,
    items: group.items.filter(item => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        group.category.toLowerCase().includes(q)
      );
    }),
  })).filter(group => group.items.length > 0);

  const flatItems = filteredGroups.flatMap(g => g.items);

  // Global hotkey listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation within list
  const handleKeyNavigation = (e) => {
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected) {
        executeCommand(selected);
      }
    }
  };

  const executeCommand = (item) => {
    setIsOpen(false);
    if (item.href.startsWith('http')) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.href === '/#demo') {
      if (window.location.pathname === '/') {
        const el = document.getElementById('demo-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#demo-section');
      }
    } else {
      router.push(item.href);
    }
  };

  return (
    <>
      {/* Trigger Button in Navbar or page */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-border rounded-lg transition-all"
        aria-label="Open Command Palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search or jump to...</span>
        <kbd className="font-mono text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/80 text-foreground/70">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 bg-secondary/30">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyNavigation}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/80 bg-secondary text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
              {filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No commands found matching &quot;{query}&quot;
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                      {group.category}
                    </div>
                    {group.items.map((item) => {
                      const itemFlatIndex = flatItems.findIndex(i => i.id === item.id);
                      const isSelected = itemFlatIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => executeCommand(item)}
                          onMouseEnter={() => setSelectedIndex(itemFlatIndex)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-foreground/80 hover:bg-secondary/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              <Icon className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate flex items-center gap-2">
                                {item.title}
                                {item.badge && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary font-semibold">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 ml-2 flex-shrink-0 opacity-0 transition-opacity ${isSelected ? 'opacity-100 text-primary' : ''}`} />
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-secondary/40 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">↵</kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">esc</kbd> close
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/60">SecretShield v0.4.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
