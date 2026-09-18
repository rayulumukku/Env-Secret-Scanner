import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    icon: AlertTriangle,
    className: 'bg-red-950/60 text-red-400 border-red-900/60 hover:bg-red-950/80',
    dotClass: 'bg-red-500',
    textClass: 'text-red-400',
  },
  HIGH: {
    label: 'High',
    icon: AlertCircle,
    className: 'bg-orange-950/60 text-orange-400 border-orange-900/60 hover:bg-orange-950/80',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-400',
  },
  MEDIUM: {
    label: 'Medium',
    icon: AlertCircle,
    className: 'bg-yellow-950/60 text-yellow-400 border-yellow-900/60 hover:bg-yellow-950/80',
    dotClass: 'bg-yellow-500',
    textClass: 'text-yellow-400',
  },
  LOW: {
    label: 'Low',
    icon: Info,
    className: 'bg-blue-950/60 text-blue-400 border-blue-900/60 hover:bg-blue-950/80',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-400',
  },
};

/**
 * @param {{ severity: string, showIcon?: boolean, size?: 'sm'|'md', className?: string }} props
 */
export function SeverityBadge({ severity, showIcon = true, size = 'sm', className }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-semibold uppercase tracking-wide border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {config.label}
    </Badge>
  );
}

/**
 * Colored dot indicator for severity.
 */
export function SeverityDot({ severity, className }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', config.dotClass, className)}
    />
  );
}

/**
 * Severity text with color.
 */
export function SeverityText({ severity, className }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  return (
    <span className={cn('font-semibold uppercase text-xs tracking-wide', config.textClass, className)}>
      {config.label}
    </span>
  );
}

export { SEVERITY_CONFIG };
