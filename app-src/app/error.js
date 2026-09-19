'use client';

/**
 * app/error.js
 *
 * Next.js Global Error Boundary.
 *
 * Security: Stack traces are NEVER shown in production.
 * Provides actionable guidance, retry button, and navigation recovery.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log safe error summary to console for developer inspection
    console.error('[GlobalError Boundary]:', error?.message || error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border border-border/60 bg-card/60 shadow-xl backdrop-blur">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-red-400">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Something Went Wrong</h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          An unexpected error occurred while rendering this page. No sensitive data was compromised.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            size="lg"
            className="w-full gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link href="/" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                Home
              </Button>
            </Link>
            <Link href="/docs" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
