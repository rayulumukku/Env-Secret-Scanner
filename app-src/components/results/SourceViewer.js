import { cn } from '@/lib/utils';
import { FileCode, Hash } from 'lucide-react';

/**
 * Source code viewer showing context lines around a finding.
 * ALWAYS masks the secret — never shows raw values.
 *
 * @param {{ lines: Array<{lineNo, content, isTarget}>, filename?: string }} props
 */
export function SourceViewer({ lines = [], filename, className }) {
  if (!lines || lines.length === 0) {
    return (
      <div className={cn('rounded-lg bg-muted/30 p-4 text-center text-muted-foreground text-sm', className)}>
        No source context available.
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg overflow-hidden border border-border/50', className)}>
      {/* File header */}
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border/50">
          <FileCode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-mono text-muted-foreground">{filename}</span>
        </div>
      )}

      {/* Code lines */}
      <div className="bg-[oklch(0.08_0.004_240)] overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr
                key={i}
                className={cn(
                  'group',
                  line.isTarget
                    ? 'bg-red-950/30 border-l-2 border-red-600'
                    : 'hover:bg-secondary/20'
                )}
              >
                {/* Line number */}
                <td className="select-none w-12 text-right pr-4 pl-3 py-0.5 text-muted-foreground/40 border-r border-border/30">
                  {line.lineNo}
                </td>
                {/* Line content */}
                <td className="px-4 py-0.5 whitespace-pre text-[13px] leading-relaxed">
                  {line.isTarget ? (
                    <HighlightedLine content={line.content} />
                  ) : (
                    <span className="text-muted-foreground/70">{line.content || ' '}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Highlight masked secrets within a line.
 * Detects •-sequences and wraps them in the masked-secret style.
 */
function HighlightedLine({ content }) {
  if (!content) return <span className="text-foreground/80">{' '}</span>;

  // Split on bullet sequences (masked secrets)
  const parts = content.split(/(•{2,})/g);

  return (
    <span className="text-foreground/90">
      {parts.map((part, i) =>
        part.match(/^•+$/) ? (
          <span key={i} className="masked-secret">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
