import Link from 'next/link';
import { Shield, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms of Service — SecretShield',
  description: 'Terms and conditions for using the SecretShield developer security platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">Last updated September 2026 · Developer Security Platform</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SecretShield (including our web application, CLI tooling, pre-commit hooks, and APIs), you agree to be bound by these terms. If you are using SecretShield on behalf of an organization, you represent that you have authority to bind that organization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Permitted Security Use</h2>
          <p>
            SecretShield is designed to assist software developers and security engineers in finding accidentally exposed credentials in source code. You agree to use SecretShield only on source code repositories, commits, and files that you own, develop, or have explicit authorization to audit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Disclaimer of Warranties</h2>
          <p>
            SecretShield is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied. While our deterministic scanner and entropy engine strive for high detection accuracy and low false-positive rates, we do not guarantee that SecretShield will detect every possible exposed secret or vulnerability in all custom formats.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Limitation of Liability</h2>
          <p>
            In no event shall the authors, contributors, or maintainers of SecretShield be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">5. Open Source License</h2>
          <p>
            The core SecretShield scanning engine and CLI utilities are licensed under the terms of the MIT License. You may inspect, modify, and distribute the software in accordance with the license conditions.
          </p>
        </section>
      </div>

      <div className="pt-8 border-t border-border/40 flex items-center justify-between">
        <Link href="/privacy" className="text-xs font-semibold text-primary hover:underline">
          Read Privacy Policy
        </Link>
        <Link href="/">
          <Button size="sm" variant="outline" className="font-semibold text-xs">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
