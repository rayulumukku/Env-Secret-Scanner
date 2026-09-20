import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Publishing Community Rule Packs — SecretShield Docs',
  description: 'How to submit, test, and publish community rule packs for public catalog listing.',
};

export default function RulePublishingDocPage() {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">COMMUNITY</Badge>
            <span className="text-xs font-mono text-muted-foreground">Publishing Workflow</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Publishing Community Rule Packs
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Community rule packs allow open-source developers to share detection patterns for specialized SDKs, developer platforms, and regional SaaS services.
          </p>
        </div>

        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Lifecycle Stages</h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-primary font-bold">1. Draft & Validation</span>
              <p className="text-muted-foreground font-sans text-[11px]">JSON schema and ReDoS safety analysis</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-yellow-400 font-bold">2. Automated Tests</span>
              <p className="text-muted-foreground font-sans text-[11px]">Positive/negative fixture execution</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-emerald-400 font-bold">3. Peer Review & Publish</span>
              <p className="text-muted-foreground font-sans text-[11px]">Global admin approval and listing</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/rules/community">
            <Button size="sm" className="bg-primary text-primary-foreground text-xs">
              Submit Rule Now &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
