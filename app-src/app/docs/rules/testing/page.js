import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Testing Rules with Synthetic Fixtures — SecretShield Docs',
  description: 'How to write positive and negative test fixtures for secret detection rules.',
};

export default function TestingRuleDocPage() {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">QUALITY</Badge>
            <span className="text-xs font-mono text-muted-foreground">Test Fixture Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Synthetic Test Fixtures & Quality Testing
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Every rule submitted to SecretShield must declare synthetic test fixtures. Test fixtures allow automated precision/recall measurement and ensure regressions are prevented.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <h3 className="font-bold text-sm text-emerald-400">Positive Fixtures (True Positives)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Synthetic strings that match the legitimate token format (using dummy characters like 111122223333...).
            </p>
            <div className="p-3 rounded-lg bg-background font-mono text-[11px] text-foreground border border-border/40">
              API_KEY=mysvc_live_11112222333344445555666677778888
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3">
            <h3 className="font-bold text-sm text-red-400">Negative Fixtures (False Positive Rejection)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Benign strings, placeholder tokens, short IDs, or mock examples that must NOT trigger an alert.
            </p>
            <div className="p-3 rounded-lg bg-background font-mono text-[11px] text-foreground border border-border/40">
              API_KEY=mysvc_live_placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
