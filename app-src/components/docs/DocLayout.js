'use client';

/**
 * components/docs/DocLayout.js
 *
 * Polished documentation hub layout with:
 * - Categorized sticky sidebar
 * - Instant local search (titles, headings, descriptions, content)
 * - Table of contents (ToC) jump navigation
 * - Copyable code blocks
 * - Previous / Next navigation
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, BookOpen, ChevronRight, ChevronLeft, Copy, Check,
  ExternalLink, Hash, ArrowLeft, ArrowRight, Shield
} from 'lucide-react';
import { DOC_SECTIONS, DOC_PAGES } from '@/lib/docs/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function CodeBlock({ code, language = 'bash' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative group my-4 rounded-xl border border-border/70 overflow-hidden bg-[oklch(0.08_0.004_240)] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border/50 text-[11px] font-mono text-muted-foreground">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/60 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function DocLayout({ currentSlug = 'getting-started', children }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Find all doc slugs for prev/next calculation
  const allDocItems = DOC_SECTIONS.flatMap(s => s.items);
  const currentIndex = allDocItems.findIndex(i => i.slug === currentSlug);
  const prevDoc = currentIndex > 0 ? allDocItems[currentIndex - 1] : null;
  const nextDoc = currentIndex !== -1 && currentIndex < allDocItems.length - 1 ? allDocItems[currentIndex + 1] : null;

  const currentPage = DOC_PAGES[currentSlug] || DOC_PAGES['getting-started'];

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? Object.values(DOC_PAGES).filter(page => {
        const q = searchQuery.toLowerCase();
        return (
          page.title.toLowerCase().includes(q) ||
          page.description.toLowerCase().includes(q) ||
          page.content.toLowerCase().includes(q) ||
          page.headings.some(h => h.title.toLowerCase().includes(q))
        );
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* ── Left Sidebar (3 cols) ────────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Doc Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card/60 border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Search Results Dropdown / Panel */}
          {searchResults && (
            <div className="p-3 rounded-xl border border-primary/30 bg-card/90 shadow-xl space-y-2">
              <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Search Results ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">No matching documentation pages.</div>
              ) : (
                searchResults.map(res => (
                  <Link
                    key={res.slug}
                    href={`/docs/${res.slug}`}
                    onClick={() => setSearchQuery('')}
                    className="block p-2 rounded-lg hover:bg-secondary/70 transition-colors"
                  >
                    <div className="text-xs font-semibold text-foreground">{res.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{res.description}</div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Navigation Categories */}
          <nav className="space-y-6" aria-label="Documentation Navigation">
            {DOC_SECTIONS.map(section => (
              <div key={section.category} className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
                  {section.category}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map(item => {
                    const isActive = currentSlug === item.slug;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={`/docs/${item.slug}`}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {isActive && <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main Content Area (6-7 cols) ─────────────────────────────────────── */}
        <main className="lg:col-span-6 xl:col-span-7 space-y-8 min-w-0">
          {/* Breadcrumb & Header */}
          <div className="space-y-2 border-b border-border/40 pb-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground">Docs</Link>
              <ChevronRight className="w-3 h-3" />
              <span>{currentPage.category}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {currentPage.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentPage.description}
            </p>
          </div>

          {/* Page Body Content */}
          <article className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/90 space-y-4">
            {children}
          </article>

          {/* Prev / Next Pagination */}
          <div className="border-t border-border/40 pt-6 mt-12 grid sm:grid-cols-2 gap-4">
            {prevDoc ? (
              <Link
                href={`/docs/${prevDoc.slug}`}
                className="p-4 rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 transition-all text-left space-y-1 group"
              >
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                  Previous Page
                </div>
                <div className="font-semibold text-sm text-foreground">{prevDoc.title}</div>
              </Link>
            ) : <div />}

            {nextDoc && (
              <Link
                href={`/docs/${nextDoc.slug}`}
                className="p-4 rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 transition-all text-right space-y-1 group sm:ml-auto w-full"
              >
                <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
                  Next Page
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="font-semibold text-sm text-foreground">{nextDoc.title}</div>
              </Link>
            )}
          </div>
        </main>

        {/* ── Right Table of Contents (2-3 cols) ───────────────────────────────── */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-4">
          <div className="sticky top-24 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-primary" />
              On this page
            </div>
            {currentPage.headings && currentPage.headings.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {currentPage.headings.map(h => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className="block py-1 text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      {h.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground/60">Overview document</p>
            )}

            <div className="pt-6 border-t border-border/40">
              <Link href="/scan">
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10">
                  <Shield className="w-3.5 h-3.5" />
                  Try Scanner Live
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
