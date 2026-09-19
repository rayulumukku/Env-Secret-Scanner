'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCode, ArrowLeft, Copy, Check, Terminal,
  Shield, Code2, AlertTriangle, Layers, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScannerApiDocsPage() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleRequest = JSON.stringify({
    files: [
      {
        name: "src/config.js",
        content: "const API_KEY = \"AKIAIOSFODNN7EXAMPLE\";\nconst DB_URL = \"postgres://user:password@localhost:5432/db\";"
      },
      {
        name: ".env.production",
        content: "STRIPE_API_KEY=your_stripe_api_key_here_placeholder"
      }
    ],
    allowlistFingerprints: [
      "fp_known_demo_hash_123"
    ]
  }, null, 2);

  const sampleResponse = JSON.stringify({
    scanId: "scan_abc12345",
    status: "completed",
    timestamp: "2026-09-20T00:00:00.000Z",
    duration: 12,
    filesScanned: 2,
    statistics: {
      filesScanned: 2,
      filesSkipped: 0,
      totalFindings: 3,
      totalSecrets: 3,
      critical: 2,
      high: 1,
      medium: 0,
      low: 0,
      allowlisted: 0,
      duration: 12,
      rulesRan: 50
    },
    findings: [
      {
        id: "f_xyz987_1",
        ruleId: "AWS_ACCESS_KEY_ID",
        type: "AWS_ACCESS_KEY_ID",
        name: "AWS Access Key ID",
        category: "Cloud Credentials",
        severity: "CRITICAL",
        confidence: 95,
        file: "src/config.js",
        line: 1,
        column: 17,
        maskedValue: "AKIAIOSF••••••••MPLE",
        description: "AWS Access Key ID detected. Grants programmatic access to AWS services.",
        remediation: "Revoke immediately in AWS IAM console. Rotate all exposed keys.",
        signals: [
          { label: "Specific pattern match for AWS Access Key ID", score: 40, positive: true },
          { label: "Sensitive variable name (api_key) in javascript", score: 20, positive: true },
          { label: "Hardcoded assignment context (javascript)", score: 10, positive: true }
        ],
        whyDetected: [
          "Matches AWS Access Key ID format specifications",
          "Assigned to a sensitive variable name (api_key)",
          "Direct hardcoded string value detected"
        ],
        quickFix: {
          suggestedEnvVar: "AWS_ACCESS_KEY_ID",
          beforeSnippet: "const AWS_ACCESS_KEY_ID = \"AKIAIOSF••••••••MPLE\";",
          afterSnippet: "const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;",
          explanation: "Extract this hardcoded secret into the environment variable AWS_ACCESS_KEY_ID."
        },
        fingerprint: "aws_access_k_e1f2a3b4"
      }
    ],
    groupedFindings: [
      {
        id: "f_xyz987_1",
        ruleId: "AWS_ACCESS_KEY_ID",
        fingerprint: "aws_access_k_e1f2a3b4",
        occurrenceCount: 1,
        occurrences: [
          { file: "src/config.js", line: 1, column: 17, maskedValue: "AKIAIOSF••••••••MPLE" }
        ]
      }
    ]
  }, null, 2);

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Scanner API Contract</h1>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  v2.0 Specification
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Programmatic endpoint documentation for SecretShield detection engine integration.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Endpoint Specification */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-primary/20 text-primary font-mono text-xs font-bold px-2.5 py-1 rounded">
                POST
              </span>
              <code className="text-sm font-mono font-semibold text-foreground">/api/scan</code>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                Stateless & Deterministic
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Accepts an array of in-memory text files and executes the 7-stage SecretShield detection intelligence pipeline (Language Detection → Provider Rules → Generic Rules → Shannon Entropy → Syntactic Context → False Positive Filtering → Confidence Scoring).
            </p>
          </div>

          {/* Request Payload */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                Request Schema
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => copyToClipboard(sampleRequest, 'req')}
              >
                {copiedSection === 'req' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSection === 'req' ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-secondary/60 border border-border/50 text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre">
              {sampleRequest}
            </pre>
          </div>

          {/* Response Payload */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Response Schema (200 OK)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => copyToClipboard(sampleResponse, 'res')}
              >
                {copiedSection === 'res' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSection === 'res' ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-secondary/60 border border-border/50 text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre">
              {sampleResponse}
            </pre>
          </div>

          {/* Field Descriptions */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Finding Field Specifications
            </h3>
            <div className="grid gap-3 text-xs">
              <div className="border-b border-border/30 pb-2">
                <code className="font-mono text-primary font-semibold">fingerprint (string)</code>
                <p className="text-muted-foreground mt-0.5">Deterministic hash of (ruleId | file | line | column | maskedValue). Used for deduplication and baselines.</p>
              </div>
              <div className="border-b border-border/30 pb-2">
                <code className="font-mono text-primary font-semibold">maskedValue (string)</code>
                <p className="text-muted-foreground mt-0.5">Sanitized representation preserving only standard prefix/suffix chars with middle masked by bullet points. Raw values never leave detection.</p>
              </div>
              <div className="border-b border-border/30 pb-2">
                <code className="font-mono text-primary font-semibold">confidence (number: 0–100)</code>
                <p className="text-muted-foreground mt-0.5">Calculated score based on provider specificity, syntactic assignment, Shannon entropy bits, and false-positive checks.</p>
              </div>
              <div className="border-b border-border/30 pb-2">
                <code className="font-mono text-primary font-semibold">whyDetected (string[])</code>
                <p className="text-muted-foreground mt-0.5">Transparent explainability bullet points describing why the token was classified as a credential.</p>
              </div>
              <div>
                <code className="font-mono text-primary font-semibold">quickFix (object)</code>
                <p className="text-muted-foreground mt-0.5">Language-specific safe code migration snippet referencing process.env / os.environ / system variables with placeholders only.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
