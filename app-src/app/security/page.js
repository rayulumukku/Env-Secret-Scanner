import Link from 'next/link';
import {
  Shield, Lock, FileCheck, CheckCircle2, AlertTriangle,
  Server, Key, RefreshCw, ArrowRight, EyeOff, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Security Architecture & Disclosure — SecretShield',
  description: 'Learn about SecretShield data handling, in-memory secret masking, threat mitigation, and responsible vulnerability disclosure.',
};

export default function SecurityDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-border/40 pb-6">
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs">
          Trust & Safety
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Security Architecture & Disclosure Policy
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          How SecretShield safeguards your proprietary source code, protects against data leakage, and handles responsible vulnerability reports.
        </p>
      </div>

      {/* Security Principles */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          1. Data Handling & Isolation Principles
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Third-Party AI APIs
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SecretShield never sends code, repository trees, or file contents to external AI models or cloud LLM endpoints. All detection is deterministic and runs locally.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Volatile In-Memory Masking
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Detected secrets are masked into 8-character fingerprints upon discovery in volatile memory. Raw credentials are never written to disk or database tables.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Hardened Archive Extraction
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Strict guards protect against Zip Slip directory traversal, Zip bombs, nested archive attacks, symlink exploits, and memory exhaustion.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ReDoS Protection Engine
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All custom regex rules are validated for exponential backtracking risks before execution, with strict per-chunk 15ms execution timeouts.
            </p>
          </div>
        </div>
      </div>

      {/* GitHub & Provider Permissions */}
      <div className="space-y-4 border-t border-border/40 pt-8">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          2. Repository Permissions & Access
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SecretShield requests only the minimum permissions required to perform security checks:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li><strong>Repository Contents (Read-only)</strong>: Scans commit diffs and modified files for credentials.</li>
          <li><strong>Pull Requests (Read & Write)</strong>: Publishes inline review comments pinpointing exposed secrets.</li>
          <li><strong>Checks & Statuses (Read & Write)</strong>: Updates GitHub Check Runs to signal pass/fail CI status.</li>
        </ul>
      </div>

      {/* Responsible Disclosure */}
      <div className="space-y-4 border-t border-border/40 pt-8">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          3. Responsible Vulnerability Disclosure
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you discover a security vulnerability or bypass in SecretShield, we appreciate your cooperation in disclosing it responsibly.
        </p>

        <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 text-xs leading-relaxed text-muted-foreground">
          <h4 className="font-bold text-sm text-foreground">How to Submit a Report:</h4>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Submit a private vulnerability report via GitHub Security Advisories on our repository.</li>
            <li>Provide reproduction steps or a minimal proof-of-concept.</li>
            <li>Allow a reasonable window for investigation and resolution before public coordination.</li>
          </ol>
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-4 border-t border-border/40 flex items-center justify-between">
        <Link href="/docs/security" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          <span>Read Security Documentation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/scan">
          <Button size="sm" className="font-semibold bg-primary text-primary-foreground">
            Run a Scan
          </Button>
        </Link>
      </div>
    </div>
  );
}
