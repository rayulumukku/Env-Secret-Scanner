'use client';

/**
 * components/demo/InteractiveDemo.js
 *
 * Interactive demo simulator for SecretShield landing page.
 *
 * SAFETY GUARANTEE:
 * Uses STRICTLY synthetic, non-functional mock data.
 * All credentials are mock demo strings clearly labeled as NON-FUNCTIONAL DEMO DATA.
 */

import React, { useState } from 'react';
import {
  Play, RefreshCw, AlertTriangle, ShieldCheck, FileCode, CheckCircle2,
  Lock, Sparkles, Copy, Check, ChevronRight, Eye, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DEMO_FILES = [
  'src/config.js',
  'server/services/openai.ts',
  'lib/database/connection.js',
  'src/utils/auth.js',
  'scripts/deploy.sh',
  'package.json',
  '.env.example',
  'README.md',
];

const SYNTHETIC_FINDINGS = [
  {
    id: 'demo-f-1',
    ruleId: 'aws-access-key',
    ruleName: 'AWS Access Key ID',
    severity: 'CRITICAL',
    confidence: 97,
    file: 'src/config.js',
    line: 42,
    maskedValue: 'AKIAIOSFODNN7EXAMPLE',
    codeSnippet: '41: export const s3Client = new S3({\n42:   accessKeyId: "AKIAIOSFODNN7EXAMPLE", // DEMO KEY\n43:   region: "us-east-1"\n44: });',
    explanation: 'Detected 20-character AWS standard access key pattern with valid header prefix and high alphanumeric entropy.',
    recommendation: 'Rotate the AWS IAM credential immediately and load credentials via AWS_ACCESS_KEY_ID environment variable or IAM Instance Roles.',
  },
  {
    id: 'demo-f-2',
    ruleId: 'openai-api-key',
    ruleName: 'OpenAI API Key',
    severity: 'CRITICAL',
    confidence: 99,
    file: 'server/services/openai.ts',
    line: 18,
    maskedValue: 'sk-proj-DEMO0000000000000000000000000000000000000000000000',
    codeSnippet: '17: const configuration = new Configuration({\n18:   apiKey: "sk-proj-DEMO0000000000000000000000000000000000000000000000",\n19: });',
    explanation: 'Detected project-scoped OpenAI secret key format (sk-proj- prefix followed by 48+ base64 characters).',
    recommendation: 'Revoke this API key from the OpenAI Developer Console and reference process.env.OPENAI_API_KEY instead.',
  },
];

export function InteractiveDemo() {
  const [scanState, setScanState] = useState('idle'); // 'idle' | 'scanning' | 'completed'
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedFinding, setSelectedFinding] = useState(SYNTHETIC_FINDINGS[0]);
  const [copied, setCopied] = useState(false);

  const startDemoScan = () => {
    setScanState('scanning');
    setCurrentFileIndex(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < DEMO_FILES.length) {
        setCurrentFileIndex(idx);
      } else {
        clearInterval(interval);
        setScanState('completed');
      }
    }, 220);
  };

  const resetDemo = () => {
    setScanState('idle');
    setCurrentFileIndex(0);
  };

  return (
    <div id="demo-section" className="rounded-2xl border border-border/80 bg-card/70 shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Demo Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-secondary/40 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-xs font-semibold text-muted-foreground ml-2">
            secretshield-interactive-demo.sh
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 text-amber-400 bg-amber-500/10">
            NON-FUNCTIONAL DEMO DATA
          </Badge>
          {scanState === 'idle' && (
            <Button
              onClick={startDemoScan}
              size="sm"
              className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Demo Scan
            </Button>
          )}
          {scanState === 'completed' && (
            <Button
              onClick={resetDemo}
              variant="outline"
              size="sm"
              className="gap-2 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo
            </Button>
          )}
        </div>
      </div>

      {/* Demo Body */}
      <div className="p-6">
        {scanState === 'idle' && (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold">Experience SecretShield in Action</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Click below to simulate scanning a synthetic repository containing sample source code files.
              No account, installations, or permissions required.
            </p>
            <Button
              onClick={startDemoScan}
              size="lg"
              className="gap-2 font-bold px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-green mt-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Run Demo Scan
            </Button>
          </div>
        )}

        {scanState === 'scanning' && (
          <div className="py-12 px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning repository files...</span>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>File {currentFileIndex + 1} of {DEMO_FILES.length}</span>
                <span>{Math.round(((currentFileIndex + 1) / DEMO_FILES.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${((currentFileIndex + 1) / DEMO_FILES.length) * 100}%` }}
                />
              </div>
              <div className="font-mono text-xs text-foreground/80 truncate">
                → analyzing {DEMO_FILES[currentFileIndex]}
              </div>
            </div>
          </div>
        )}

        {scanState === 'completed' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Scan Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-secondary/30 border border-border/60">
              <div>
                <span className="text-xs text-muted-foreground block">Files Scanned</span>
                <span className="text-lg font-bold font-mono text-foreground">8 files</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Findings Detected</span>
                <span className="text-lg font-bold font-mono text-red-400">2 Critical</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Scan Duration</span>
                <span className="text-lg font-bold font-mono text-primary">38ms</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Data Transmitted</span>
                <span className="text-lg font-bold font-mono text-emerald-400">0 bytes (Local)</span>
              </div>
            </div>

            {/* Finding Split View */}
            <div className="grid lg:grid-cols-12 gap-5">
              {/* Left Column: Finding Cards */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Detected Findings (2)
                </div>

                {SYNTHETIC_FINDINGS.map(finding => {
                  const isSelected = selectedFinding.id === finding.id;
                  return (
                    <div
                      key={finding.id}
                      onClick={() => setSelectedFinding(finding)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary/50 bg-primary/5 shadow-md'
                          : 'border-border/60 bg-card/40 hover:bg-card/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-sm text-foreground">{finding.ruleName}</span>
                        </div>
                        <Badge className="text-[10px] font-mono bg-red-500/20 text-red-300 border-red-500/30">
                          {finding.confidence}% Conf
                        </Badge>
                      </div>

                      <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <FileCode className="w-3 h-3" />
                        <span>{finding.file}:{finding.line}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Finding Intelligence & Remediation */}
              <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-foreground">{selectedFinding.ruleName}</h4>
                    <p className="text-xs font-mono text-muted-foreground">
                      {selectedFinding.file}:{selectedFinding.line}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                    CRITICAL SEVERITY
                  </Badge>
                </div>

                {/* Masked Code Snippet */}
                <div className="rounded-lg border border-border/60 bg-[oklch(0.08_0.004_240)] p-3.5 font-mono text-xs">
                  <div className="text-muted-foreground/60 mb-1 flex items-center justify-between text-[11px]">
                    <span>Source Extract (Masked)</span>
                    <span className="text-amber-400/90 font-sans">NON-FUNCTIONAL DEMO DATA</span>
                  </div>
                  <pre className="text-foreground/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {selectedFinding.codeSnippet}
                  </pre>
                </div>

                {/* Intelligence Rationale */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Why was this detected?
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedFinding.explanation}
                  </p>
                </div>

                {/* Recommended Remediation */}
                <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Immediate Remediation
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedFinding.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
