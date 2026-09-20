'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { validateRegexSafety } from '@/lib/scanner/regex-safety';
import {
  FlaskConical, ArrowLeft, Play, Sparkles, CheckCircle2,
  AlertTriangle, Code2, ShieldAlert, Check, FileText,
  Layers, Cpu, Activity, RefreshCw, Eye
} from 'lucide-react';

const SAMPLE_FIXTURES = [
  {
    id: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    category: 'Cloud',
    severity: 'HIGH',
    confidence: 95,
    pattern: '(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}',
    positiveFixtures: [
      'AWS_ACCESS_KEY_ID=AKIAEXAMPLEKEY123456',
      'const key = "AKIA1234567890ABCDEF";'
    ],
    negativeFixtures: [
      'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      'const dummy = "NOT_AN_AWS_KEY";'
    ],
    sampleCode: `// AWS S3 client configuration\nconst AWS_ACCESS_KEY_ID = "AKIAEXAMPLEKEY123456";\nconst S3_BUCKET = "prod-backups";`,
  },
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    category: 'AI',
    severity: 'CRITICAL',
    confidence: 98,
    pattern: 'sk-(?:proj-)?[A-Za-z0-9_-]{32,128}',
    positiveFixtures: [
      'OPENAI_API_KEY=sk-proj-abc1234567890defghijklmnopqrstuvwx'
    ],
    negativeFixtures: [
      'OPENAI_API_KEY=sk-placeholder-mock'
    ],
    sampleCode: `import OpenAI from 'openai';\nconst openai = new OpenAI({\n  apiKey: 'sk-proj-abc1234567890defghijklmnopqrstuvwx',\n});`,
  },
  {
    id: 'postgres-connection-url',
    name: 'PostgreSQL Connection URL',
    category: 'Databases',
    severity: 'CRITICAL',
    confidence: 94,
    pattern: 'postgres(?:ql)?://[a-zA-Z0-9_\\-\\.]+:[^@\\s\'"]+@[a-zA-Z0-9_\\-\\.]+:[0-9]{2,5}/[a-zA-Z0-9_\\-\\.]+',
    positiveFixtures: [
      'DATABASE_URL=postgres://app_user:SuperSecretPass123@db.prod.internal:5432/appdb'
    ],
    negativeFixtures: [
      'DATABASE_URL=postgres://localhost:5432/testdb'
    ],
    sampleCode: `const { Pool } = require('pg');\nconst pool = new Pool({\n  connectionString: 'postgres://app_user:SuperSecretPass123@db.prod.internal:5432/appdb'\n});`,
  },
  {
    id: 'custom-rule',
    name: 'Custom Internal Regex',
    category: 'Custom',
    severity: 'HIGH',
    confidence: 85,
    pattern: 'corp_token_[a-zA-Z0-9]{24,48}',
    positiveFixtures: [
      'CORP_TOKEN=corp_token_111122223333444455556666'
    ],
    negativeFixtures: [
      'CORP_TOKEN=corp_token_short'
    ],
    sampleCode: `// Internal API gateway token\nconst API_KEY = "corp_token_111122223333444455556666";`,
  },
];

export default function RuleLabPage() {
  const [selectedRuleId, setSelectedRuleId] = useState(SAMPLE_FIXTURES[0].id);
  const [customPattern, setCustomPattern] = useState(SAMPLE_FIXTURES[0].pattern);
  const [code, setCode] = useState(SAMPLE_FIXTURES[0].sampleCode);
  const [filename, setFilename] = useState('src/config.js');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [regexSafety, setRegexSafety] = useState({ valid: true });

  const activeRule = SAMPLE_FIXTURES.find(r => r.id === selectedRuleId) || SAMPLE_FIXTURES[0];

  useEffect(() => {
    if (customPattern.trim()) {
      const val = validateRegexSafety(customPattern.trim());
      setRegexSafety(val);
    }
  }, [customPattern]);

  const handleSelectRule = (ruleId) => {
    setSelectedRuleId(ruleId);
    const r = SAMPLE_FIXTURES.find(x => x.id === ruleId);
    if (r) {
      setCustomPattern(r.pattern);
      setCode(r.sampleCode);
      setTestResult(null);
    }
  };

  const handleRunTest = async (runFixtures = false) => {
    setIsTesting(true);
    try {
      const payload = {
        rule: {
          id: selectedRuleId,
          name: activeRule.name,
          pattern: customPattern,
          severity: activeRule.severity,
          confidence: activeRule.confidence,
          testFixtures: {
            positive: activeRule.positiveFixtures,
            negative: activeRule.negativeFixtures,
          },
        },
        content: code,
        filename,
        runFixtures,
      };

      const res = await fetch('/api/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data.data);
      } else {
        setTestResult({ error: data.error?.message || 'Testing failed' });
      }
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/rules">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rules
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  LAB TESTING BENCH
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Zero-Persistence Sandbox</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Rule Testing & Quality Lab
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Safely test regex patterns, inspect Shannon entropy scores, and benchmark fixture precision.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/rules/marketplace">
                <Button variant="outline" size="sm" className="text-xs">
                  Rule Marketplace
                </Button>
              </Link>
              <Link href="/rules/community">
                <Button size="sm" className="text-xs bg-primary text-primary-foreground">
                  Submit Community Rule
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              <strong>Zero-Exposure Guarantee:</strong> Test inputs are evaluated in-memory and discarded. Raw secret values are never persisted or returned in API responses.
            </span>
          </div>
        </div>

        {/* Main Grid: Left Config, Right Test Area */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Rule Selector & Pattern Editor */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rule Selector */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                1. Select Detection Rule
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_FIXTURES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRule(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRuleId === r.id
                        ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                        : 'border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern & Safety Box */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Regular Expression Pattern
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    regexSafety.valid
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-red-500/40 text-red-400 bg-red-500/10'
                  }`}
                >
                  {regexSafety.valid ? 'ReDoS Safe' : 'ReDoS Warning'}
                </Badge>
              </div>

              <textarea
                rows={3}
                value={customPattern}
                onChange={e => setCustomPattern(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary resize-none"
              />

              {!regexSafety.valid && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{regexSafety.error || 'Potential catastrophic backtracking construct detected.'}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={() => handleRunTest(false)}
                disabled={isTesting || !regexSafety.valid}
                className="w-full gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="w-4 h-4" />
                {isTesting ? 'Evaluating Match...' : 'Test Pattern on Synthetic Content'}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRunTest(true)}
                disabled={isTesting || !regexSafety.valid}
                className="w-full gap-2 text-xs"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                Run Benchmark & Fixtures Quality
              </Button>
            </div>
          </div>

          {/* Right Column: Code Editor & Live Findings */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Synthetic Code Input</span>
                </div>
                <input
                  type="text"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-background border border-border/60 text-muted-foreground w-40"
                  placeholder="src/config.js"
                />
              </div>

              <textarea
                rows={9}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste synthetic sample code containing test credentials here..."
                className="w-full p-3 font-mono text-xs rounded-xl border border-border/70 bg-[oklch(0.08_0.005_240)] text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Results Output */}
            {testResult && (
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4 animate-in fade-in">
                {testResult.error ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{testResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Match Results ({testResult.matchesCount} detected)
                      </h3>
                      {testResult.qualityReport && (
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${
                            testResult.qualityReport.status === 'PASSING'
                              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                              : 'text-yellow-400 border-yellow-500/40'
                          }`}
                        >
                          Quality: {testResult.qualityReport.status}
                        </Badge>
                      )}
                    </div>

                    {/* Fixture Benchmark Card */}
                    {testResult.qualityReport && (
                      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Precision</span>
                          <span className="text-sm font-bold text-foreground">
                            {testResult.qualityReport.metrics.precision}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Recall</span>
                          <span className="text-sm font-bold text-foreground">
                            {testResult.qualityReport.metrics.recall}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Avg Latency</span>
                          <span className="text-sm font-bold text-primary">
                            {testResult.qualityReport.metrics.avgExecutionTimeMs} ms
                          </span>
                        </div>
                      </div>
                    )}

                    {testResult.matches.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                        No matches found in the synthetic content for this pattern.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {testResult.matches.map((m, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={m.severity} />
                                <span className="font-semibold text-xs text-foreground">{m.name}</span>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                Line {m.line}:{m.column}
                              </span>
                            </div>

                            <div className="p-2 rounded bg-background/80 border border-border/40 font-mono text-xs text-amber-300">
                              <span>Matched: </span>
                              <code>{m.maskedValue}</code>
                            </div>

                            <div className="text-[11px] text-muted-foreground space-y-1 pt-1">
                              {m.whyDetected?.map((why, wIdx) => (
                                <div key={wIdx} className="flex items-center gap-1.5">
                                  <span className="text-primary">•</span>
                                  <span>{why}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
