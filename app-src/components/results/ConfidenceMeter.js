import { cn } from '@/lib/utils';

/**
 * Confidence meter bar.
 * @param {{ confidence: number, showLabel?: boolean, className?: string }} props
 */
export function ConfidenceMeter({ confidence, showLabel = true, className }) {
  const pct = Math.max(0, Math.min(100, confidence));

  const color =
    pct >= 90 ? 'bg-red-500' :
    pct >= 75 ? 'bg-orange-500' :
    pct >= 60 ? 'bg-yellow-500' :
    'bg-blue-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-mono w-8 text-right">{pct}%</span>
      )}
    </div>
  );
}
