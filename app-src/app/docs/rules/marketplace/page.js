import Link from 'next/link';
import { ArrowLeft, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Rule Pack Marketplace — SecretShield Docs',
  description: 'Catalog discovery, verified pack installations, and integrity verification.',
};

export default function RuleMarketplaceDocPage() {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">DISCOVERY</Badge>
            <span className="text-xs font-mono text-muted-foreground">Catalog & Distribution</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Rule Pack Marketplace & Catalog
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            The SecretShield Rule Marketplace allows developers and security engineers to discover, inspect, and activate verified detection rule packs.
          </p>
        </div>

        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Integrity & Zero-Fabrication Guarantee</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The marketplace strictly displays verifiable factual properties: pack author, open-source license, rule count, test fixture status, and cryptographic SHA-256 canonical hash. No fake popularity numbers, download counts, or arbitrary ratings are ever shown.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/rules/marketplace">
            <Button size="sm" className="bg-primary text-primary-foreground text-xs">
              Open Marketplace &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
