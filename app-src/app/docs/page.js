import Link from 'next/link';
import {
  BookOpen, Terminal, Shield, Zap, GitBranch, Cpu,
  Sliders, CheckCircle2, Lock, ArrowRight, HelpCircle
} from 'lucide-react';
import { DocLayout } from '@/components/docs/DocLayout';
import { DOC_SECTIONS } from '@/lib/docs/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Documentation — SecretShield',
  description: 'Technical guides, architecture overviews, CLI usage, and API reference for SecretShield.',
};

const TOPIC_ICONS = {
  'getting-started': BookOpen,
  'scanner': Cpu,
  'cli': Terminal,
  'pre-commit': Shield,
  'github': GitBranch,
  'gitlab': GitBranch,
  'github-actions': Zap,
  'custom-rules': Sliders,
  'baseline': CheckCircle2,
  'remediation': Lock,
  'api': Terminal,
  'security': Shield,
  'privacy': Lock,
  'faq': HelpCircle,
};

export default function DocsIndexPage() {
  return (
    <DocLayout currentSlug="getting-started">
      <div className="space-y-8">
        <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            SecretShield Documentation Hub
          </Badge>
          <h2 className="text-xl font-bold text-foreground">
            Explore Architecture, Tools, and Integrations
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to the official developer documentation for SecretShield. Everything you need to scan code, configure Git hooks, protect GitHub/GitLab repositories, and remediate exposed credentials.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/docs/getting-started">
              <Button size="sm" className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                Start Quickstart Guide
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/docs/cli">
              <Button variant="outline" size="sm" className="gap-2 font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                CLI Documentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-6">
          {DOC_SECTIONS.map(section => (
            <div key={section.category} className="space-y-3">
              <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-2">
                {section.category}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {section.items.map(item => {
                  const Icon = TOPIC_ICONS[item.slug] || BookOpen;
                  return (
                    <Link
                      key={item.slug}
                      href={`/docs/${item.slug}`}
                      className="p-4 rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 transition-all group block space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-secondary text-primary group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                        {item.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DocLayout>
  );
}
