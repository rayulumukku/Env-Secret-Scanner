/**
 * components/ui/states.js
 *
 * Production UI state components:
 * - ErrorState
 * - EmptyState
 * - LoadingState
 * - Skeleton / SkeletonCard
 * - RetryButton
 *
 * Designed with full accessibility, screen reader friendliness, and zero raw stack trace exposure.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, Inbox, Loader2 } from 'lucide-react';
import { Button } from './button';

/**
 * Reusable Error State
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  code,
  onRetry,
  showHomeLink = true,
  className = '',
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-lg mx-auto my-8 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
        <AlertCircle className="w-7 h-7" aria-hidden="true" />
      </div>

      {code && (
        <span className="inline-block font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-2">
          ERROR {code}
        </span>
      )}

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-500/30 hover:bg-red-500/10 text-foreground font-semibold gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </Button>
        )}
        {showHomeLink && (
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Return to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable Empty State
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your criteria or currently available.',
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) {
  return (
    <div className={`rounded-2xl border border-border/50 bg-card/30 p-10 text-center max-w-md mx-auto my-6 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <h4 className="text-base font-semibold text-foreground mb-1.5">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>

      {actionHref && actionLabel && (
        <Link href={actionHref}>
          <Button size="sm" className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            {actionLabel}
          </Button>
        </Link>
      )}

      {onAction && actionLabel && !actionHref && (
        <Button size="sm" onClick={onAction} className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Reusable Loading State
 */
export function LoadingState({
  message = 'Loading data...',
  className = '',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center text-muted-foreground ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
      <span className="sr-only">Loading content</span>
    </div>
  );
}

/**
 * Reusable Skeleton Line / Box
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-secondary/60 ${className}`}
    />
  );
}

/**
 * Card Skeleton
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div aria-hidden="true" className={`rounded-xl border border-border/40 bg-card/40 p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Standalone Retry Button
 */
export function RetryButton({ onClick, loading = false, label = 'Retry', className = '' }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={`gap-1.5 ${className}`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
