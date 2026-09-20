import Link from 'next/link';
import { ArrowLeft, Terminal, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'CLI Rule Commands Reference — SecretShield Docs',
  description: 'Command line usage reference for managing, testing, and installing rule packs with SecretShield CLI.',
};

export default function RuleCliDocPage() {
  const commands = [
    { cmd: 'secretshield rules list', desc: 'List all installed rule packs and active detection rules.' },
    { cmd: 'secretshield rules search <query>', desc: 'Search detection catalog by keyword, provider, or category.' },
    { cmd: 'secretshield rules validate <path>', desc: 'Validate a rule pack manifest or rule JSON for schema and ReDoS safety.' },
    { cmd: 'secretshield rules test <rule-id-or-path>', desc: 'Run positive and negative synthetic test fixtures against a rule.' },
    { cmd: 'secretshield rules install <path>', desc: 'Install a declarative rule pack manifest with integrity verification.' },
    { cmd: 'secretshield rules remove <pack-id>', desc: 'Uninstall an optional rule pack.' },
    { cmd: 'secretshield rules info <pack-id>', desc: 'Display detailed metadata and rule listings for a pack.' },
  ];

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
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">CLI REFERENCE</Badge>
            <span className="text-xs font-mono text-muted-foreground">Command Line Interface</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            CLI Rule Commands Reference
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            The SecretShield CLI includes full offline and local management for rule packs, manifest validation, and fixture testing.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Available Commands
          </h2>

          <div className="space-y-3">
            {commands.map((c, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-1.5">
                <div className="font-mono text-xs text-primary font-bold">{c.cmd}</div>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/40 border border-border/60 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-sm text-foreground">Configuration File Schema (.secretshield.json)</h3>
          <div className="p-4 rounded-xl bg-[oklch(0.08_0.005_240)] font-mono text-xs text-muted-foreground border border-border/60 space-y-1">
            <p className="text-foreground">&#123;</p>
            <p className="pl-4 text-emerald-400">&quot;rules&quot;: &#123;</p>
            <p className="pl-8 text-primary">&quot;packs&quot;: [&quot;core-rules&quot;, &quot;community-rules&quot;],</p>
            <p className="pl-8 text-yellow-300">&quot;disabled&quot;: [&quot;jwt-token&quot;],</p>
            <p className="pl-8 text-foreground">&quot;lockedVersions&quot;: &#123; &quot;community-rules&quot;: &quot;1.0.0&quot; &#125;</p>
            <p className="pl-4 text-emerald-400">&#125;</p>
            <p className="text-foreground">&#125;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
