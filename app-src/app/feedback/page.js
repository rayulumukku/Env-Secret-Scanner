'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquarePlus, AlertCircle, ShieldAlert, Sparkles,
  Bug, Lightbulb, CheckCircle2, ArrowRight, ShieldCheck,
  HelpCircle, AlertTriangle, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { FalsePositiveModal } from '@/components/feedback/FalsePositiveModal';
import { FalseNegativeModal } from '@/components/feedback/FalseNegativeModal';

export default function FeedbackHubPage() {
  const [activeModal, setActiveModal] = useState(null); // 'general' | 'false_positive' | 'false_negative'

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Product Feedback & Quality
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Help Us Improve SecretShield
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Your feedback directly guides our detection rules, performance optimizations, and developer experience.
          </p>
        </div>

        {/* Security Warning Callout */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">
              Privacy & Security Rule: Never Submit Live Credentials
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When reporting detection issues, false positives, or false negatives, please mask all sensitive tokens (e.g. replace actual characters with <code className="text-amber-300 font-mono">AKIA••••••••••••MPLE</code> or <code className="text-amber-300 font-mono">sk_live_xxxx...</code>). Our automated ingest pipeline strips obvious secrets, but safety starts on your keyboard.
            </p>
          </div>
        </div>

        {/* Feedback Options Grid */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Option 1: General Feedback / Feature Request */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Feature or UX Feedback</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share suggestions for new detectors, CLI flags, dashboard metrics, or workflow improvements.
              </p>
            </div>
            <Button
              onClick={() => setActiveModal('general')}
              className="w-full gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Give Feedback
            </Button>
          </div>

          {/* Option 2: Report False Positive */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 flex flex-col justify-between space-y-4 hover:border-yellow-500/50 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">False Positive Report</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A non-secret (like a mock key, test fixture, or dummy hash) was incorrectly flagged as a leak.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setActiveModal('false_positive')}
              className="w-full gap-2 font-semibold border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
            >
              <AlertCircle className="w-4 h-4" />
              Report False Positive
            </Button>
          </div>

          {/* Option 3: Report False Negative */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 flex flex-col justify-between space-y-4 hover:border-red-500/50 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">False Negative (Missed)</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A real credential format or custom token was scanned but not caught by our rule engines.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setActiveModal('false_negative')}
              className="w-full gap-2 font-semibold border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <ShieldAlert className="w-4 h-4" />
              Report Missed Secret
            </Button>
          </div>
        </div>

        {/* Community & GitHub Issue Links */}
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm text-foreground">Prefer Open Source Issue Tracking?</h4>
            <p className="text-xs text-muted-foreground">
              You can also open public discussions or bug reports directly on our GitHub repository.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/support">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Support Center
              </Button>
            </Link>
            <Link href="/docs/rules/custom-rules">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-primary">
                Rule Lab & Docs
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'general' && (
        <FeedbackModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'false_positive' && (
        <FalsePositiveModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'false_negative' && (
        <FalseNegativeModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
