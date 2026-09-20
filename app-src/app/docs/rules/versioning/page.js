import Link from 'next/link';
import { ArrowLeft, Tag, CheckCircle2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Rule Semantic Versioning — SecretShield Docs',
  description: 'How semantic versioning ensures historical finding reproducibility and smooth rule migrations.',
};

export default function RuleVersioningDocPage() {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">SPECIFICATION</Badge>
            <span className="text-xs font-mono text-muted-foreground">Reproducibility & Semver</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Rule Versioning & Finding Reproducibility
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            In enterprise security audits, triage teams must be able to reproduce why a finding was flagged months or years in the past. Every finding in SecretShield permanently records its exact version lineage.
          </p>
        </div>

        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Finding Version Lineage Schema</h2>
          <div className="p-4 rounded-xl bg-[oklch(0.08_0.005_240)] font-mono text-xs text-muted-foreground border border-border/60 space-y-1">
            <p className="text-foreground">&#123;</p>
            <p className="pl-4 text-emerald-400">&quot;ruleId&quot;: &quot;aws-access-key-id&quot;,</p>
            <p className="pl-4 text-emerald-400">&quot;ruleVersion&quot;: &quot;1.0.0&quot;,</p>
            <p className="pl-4 text-primary">&quot;rulePackId&quot;: &quot;core-rules&quot;,</p>
            <p className="pl-4 text-primary">&quot;rulePackVersion&quot;: &quot;1.0.0&quot;,</p>
            <p className="pl-4 text-yellow-300">&quot;scannerVersion&quot;: &quot;2.0.0&quot;</p>
            <p className="text-foreground">&#125;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
