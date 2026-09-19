import Link from 'next/link';
import {
  Shield, Lock, FileCheck, CheckCircle2, AlertTriangle,
  Server, Key, RefreshCw, ArrowRight, EyeOff, GitBranch, ArrowLeft
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
      <Link href="/security" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Security Command Center
      </Link>

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
        </div>
      </div>
    </div>
  );
}
