import Link from 'next/link';
import {
  LifeBuoy, HelpCircle, BookOpen, Terminal,
  Mail, MessageSquare, AlertTriangle, ShieldCheck,
  ArrowRight, ExternalLink, FileText, CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Support Center — SecretShield',
  description: 'Documentation, troubleshooting guides, system status, and technical assistance for SecretShield.',
};

const COMMON_ISSUES = [
  {
    q: 'How do I resolve a "high entropy string" false positive on a test UUID?',
    a: 'Add the test file path to .secretshieldignore or use our 1-click baseline generator (secretshield baseline --generate) to record the test token in .secretshield-baseline.json.',
    link: '/docs/rules/baselines',
  },
  {
    q: 'Pre-commit hook is blocking commits during urgent deployment. What can I do?',
    a: 'You can bypass the hook for emergency hotfixes using git commit --no-verify. However, we strongly recommend generating a temporary baseline entry instead of committing unmasked secrets.',
    link: '/docs/integrations/git-hooks',
  },
  {
    q: 'Can SecretShield run in an air-gapped VPC without public internet access?',
    a: 'Yes. SecretShield runs 100% deterministically without external model calls, analytics telemetry phoning home, or remote license server pings.',
    link: '/docs/operations/air-gapped',
  },
  {
    q: 'How do I export SARIF results into GitHub Advanced Security?',
    a: 'Run `secretshield scan . --sarif secretshield-results.sarif` and pass the output to github/codeql-action/upload-sarif@v3 in your GitHub Action workflow.',
    link: '/docs/ci/github-actions',
  },
];

export default function SupportCenterPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Help & Resources
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            SecretShield Support Center
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Find quick answers, explore comprehensive guides, or get in touch with our engineering team.
          </p>
        </div>

        {/* Quick Access Grid */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Documentation</h2>
              <p className="text-xs text-muted-foreground">
                In-depth guides for CLI, CI/CD, Custom Regex Rules, and baseline configurations.
              </p>
            </div>
            <Link href="/docs">
              <Button variant="outline" className="w-full gap-2 text-xs">
                Explore Docs
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">System Status</h2>
              <p className="text-xs text-muted-foreground">
                Real-time operational health for all scanner engines, API endpoints, and webhooks.
              </p>
            </div>
            <Link href="/status">
              <Button variant="outline" className="w-full gap-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                View Status
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Contact Support</h2>
              <p className="text-xs text-muted-foreground">
                Submit an inquiry or technical escalation directly to the maintainers.
              </p>
            </div>
            <Link href="/support/contact">
              <Button className="w-full gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Open Ticket
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Common Troubleshooting Guides */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">Frequently Asked Questions</h3>
            <Link href="/feedback" className="text-xs text-primary hover:underline">
              Submit Feedback &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {COMMON_ISSUES.map((issue, idx) => (
              <div key={idx} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  {issue.q}
                </h4>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  {issue.a}
                </p>
                <div className="pl-6 pt-1">
                  <Link href={issue.link} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                    Read guide
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Support communication is private and encrypted. Never paste raw secrets in tickets.</span>
          </div>
          <Link href="/docs/privacy/analytics" className="text-primary hover:underline text-[11px]">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
