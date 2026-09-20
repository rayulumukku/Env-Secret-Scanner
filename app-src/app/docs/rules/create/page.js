import Link from 'next/link';
import { FileCode, ArrowLeft, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Creating Declarative Rules — SecretShield Docs',
  description: 'How to create declarative secret detection rules with regular expressions, entropy checks, and keywords.',
};

export default function CreateRuleDocPage() {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">TUTORIAL</Badge>
            <span className="text-xs font-mono text-muted-foreground">Rule Authoring Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Authoring Declarative Rules
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            All SecretShield rules are defined declaratively in JSON. Rules specify target patterns, keywords, entropy boundaries, and test fixtures without writing executable code.
          </p>
        </div>

        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Example Rule JSON</h2>
          <div className="p-4 rounded-xl bg-[oklch(0.08_0.005_240)] font-mono text-xs text-muted-foreground border border-border/60 overflow-x-auto">
            <pre>{`{
  "id": "my-service-api-key",
  "name": "MyService API Key",
  "description": "Authenticates API requests to MyService backend",
  "provider": "MyService",
  "category": "Cloud",
  "severity": "CRITICAL",
  "confidence": 95,
  "version": "1.0.0",
  "patterns": [
    "mysvc_live_[A-Za-z0-9]{32}"
  ],
  "keywords": ["mysvc_live_", "MYSERVICE_KEY"],
  "testFixtures": {
    "positive": [
      "MYSERVICE_KEY=mysvc_live_11112222333344445555666677778888"
    ],
    "negative": [
      "MYSERVICE_KEY=mysvc_live_placeholder"
    ]
  }
}`}</pre>
          </div>
        </div>

        <div className="bg-card/40 border border-border/60 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-sm text-foreground">Next Steps</h3>
          <div className="flex items-center gap-3">
            <Link href="/rules/lab">
              <Button size="sm" className="bg-primary text-primary-foreground text-xs">
                Open Rule Lab
              </Button>
            </Link>
            <Link href="/docs/rules/testing">
              <Button variant="outline" size="sm" className="text-xs">
                Read Fixtures Guide
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
