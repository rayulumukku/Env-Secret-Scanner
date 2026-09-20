import Link from 'next/link';
import { ArrowLeft, ShieldAlert, CheckCircle2, Lock, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Rule Security & ReDoS Prevention — SecretShield Docs',
  description: 'Security architecture, catastrophic backtracking prevention, and declarative execution boundaries.',
};

export default function RuleSecurityDocPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
          <Link href="/docs/rules">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rule Packs Docs
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">SECURITY SPEC</Badge>
            <span className="text-xs font-mono text-muted-foreground">ReDoS & Safe Execution</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Rule Pack Security & ReDoS Prevention
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Because SecretShield runs in CI/CD pipelines and developer pre-commit hooks, detection rules must be mathematically guaranteed to avoid catastrophic backtracking and resource exhaustion.
          </p>
        </div>

        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Core Security Guarantees
          </h2>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong>Zero Dynamic Execution:</strong> Rule packs are declarative JSON manifests only. No <code>eval()</code>, <code>vm</code>, or external script execution is ever permitted.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong>ReDoS Backtracking Guard:</strong> Patterns with nested quantifiers (e.g. <code>(a+)+</code> or <code>(a*)*</code>) are rejected immediately at validation time.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong>Resource Limits:</strong> Max 1,000 characters per pattern, max 500 rules per pack, and max 1MB total manifest size.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
