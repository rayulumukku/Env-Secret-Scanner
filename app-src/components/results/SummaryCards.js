import { cn } from '@/lib/utils';
import {
  Shield, AlertTriangle, AlertCircle, Info,
  Files, Clock, CheckCircle2, EyeOff
} from 'lucide-react';

/**
 * Summary stat cards for scan results.
 */
export function SummaryCards({ stats, duration, className }) {
  const cards = [
    {
      label: 'Files Scanned',
      value: stats?.filesScanned ?? 0,
      icon: Files,
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary/50',
      borderColor: 'border-border/50',
    },
    {
      label: 'Critical',
      value: stats?.critical ?? 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: stats?.critical > 0 ? 'bg-red-950/30' : 'bg-secondary/30',
      borderColor: stats?.critical > 0 ? 'border-red-900/40' : 'border-border/30',
    },
    {
      label: 'High',
      value: stats?.high ?? 0,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: stats?.high > 0 ? 'bg-orange-950/30' : 'bg-secondary/30',
      borderColor: stats?.high > 0 ? 'border-orange-900/40' : 'border-border/30',
    },
    {
      label: 'Medium',
      value: stats?.medium ?? 0,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: stats?.medium > 0 ? 'bg-yellow-950/30' : 'bg-secondary/30',
      borderColor: stats?.medium > 0 ? 'border-yellow-900/40' : 'border-border/30',
    },
    {
      label: 'Low',
      value: stats?.low ?? 0,
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-secondary/30',
      borderColor: 'border-border/30',
    },
    {
      label: 'Total Findings',
      value: stats?.totalFindings ?? 0,
      icon: Shield,
      color: stats?.totalFindings > 0 ? 'text-primary' : 'text-muted-foreground',
      bgColor: 'bg-secondary/50',
      borderColor: 'border-border/50',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Duration row */}
      {duration != null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Scan completed in <span className="text-foreground font-mono">{duration}ms</span></span>
          {stats?.allowlisted > 0 && (
            <span className="ml-2 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              {stats.allowlisted} allowlisted
            </span>
          )}
        </div>
      )}

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'rounded-xl border p-3.5 transition-colors',
                card.bgColor,
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-4 h-4', card.color)} />
              </div>
              <p className={cn('text-2xl font-bold font-mono', card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
