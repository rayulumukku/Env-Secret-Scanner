'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { useCustomRules } from '@/lib/hooks/useCustomRules';
import { scanString } from '@/lib/scanner/engine';
import { validateRegexSafety } from '@/lib/scanner/regex-safety';
import {
  FlaskConical, ArrowLeft, Play, Sparkles, CheckCircle2,
  AlertTriangle, Code2, ShieldAlert, Copy, Check, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_TEMPLATES = [
  {
    name: 'AWS Access Key',
    language: 'javascript',
    code: `// AWS S3 client initialization\nconst AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";\nconst AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";\n\nconsole.log("Configured AWS client");`,
  },
  {
    name: 'Python Database URI',
    language: 'python',
    code: `# Database configuration\nDATABASE_URL = "postgres://admin:SuperSecretPass123@db.prod.acme.internal:5432/appdb"\n\ndef get_connection():\n    return create_engine(DATABASE_URL)`,
  },
  {
    name: '.env Environment File',
    language: 'dotenv',
    code: `NODE_ENV=production\nPORT=8080\nAPI_TOKEN=prod_token_abc1234567890example\nDATABASE_URL=postgres://app:SecretPass456@db.internal:5432/app\nJWT_SECRET=super_secret_signing_key_4839281`,
  },
  {
    name: 'Docker Compose Config',
    language: 'yaml',
    code: `version: '3.8'\nservices:\n  api:\n    image: acme/api:latest\n    environment:\n      - APP_SECRET=production_secret_key_1234567890\n      - DB_PASSWORD=VerySecurePassword987654321`,
  },
];

export default function RuleLabPage() {
  const { rules: customRules } = useCustomRules();
  const [selectedTemplate, setSelectedTemplate] = useState(SAMPLE_TEMPLATES[0].name);
  const [filename, setFilename] = useState('src/config.js');
  const [code, setCode] = useState(SAMPLE_TEMPLATES[0].code);
  const [customPattern, setCustomPattern] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [regexValidation, setRegexValidation] = useState(null);

  const handleTemplateChange = (name) => {
    const t = SAMPLE_TEMPLATES.find(x => x.name === name);
    if (t) {
      setSelectedTemplate(t.name);
      setCode(t.code);
      setFilename(t.language === 'dotenv' ? '.env' : t.language === 'python' ? 'src/db.py' : t.language === 'yaml' ? 'docker-compose.yml' : 'src/config.js');
    }
  };

  const handlePatternChange = (pat) => {
    setCustomPattern(pat);
    if (pat.trim()) {
      const val = validateRegexSafety(pat);
      setRegexValidation(val);
    } else {
      setRegexValidation(null);
    }
  };

  const handleRunLab = () => {
    setIsScanning(true);
    try {
      const customRulesList = [];
      if (customPattern.trim() && regexValidation?.valid) {
        customRulesList.push({
          id: 'lab_test_rule',
          name: 'Interactive Lab Rule',
          pattern: customPattern.trim(),
          severity: 'HIGH',
          enabled: true,
        });
      }

      const res = scanString(code, filename, { customRules: customRulesList });
      setScanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/rules" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Rule Testing Lab</h1>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Interactive Sandbox
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Test detection rules against synthetic source code snippets in a deterministic local environment.
              </p>
            </div>
          </div>
          <Button onClick={handleRunLab} disabled={isScanning} className="gap-2">
            <Play className="w-3.5 h-3.5 fill-current" />
            {isScanning ? 'Running...' : 'Run Detection'}
          </Button>
        </div>

        {/* Template Selector & Filename */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-4 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Synthetic Sample Templates</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.name}
                  onClick={() => handleTemplateChange(tmpl.name)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                    selectedTemplate === tmpl.name
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-border/40 hover:bg-secondary text-muted-foreground'
                  )}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Simulated File Path</label>
            <Input
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="bg-secondary/50 h-9 text-xs font-mono"
              placeholder="e.g. src/auth/service.js"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Code Editor & Custom Regex Input */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  Test Snippet (Synthetic Content)
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">Local execution only</span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border/60 bg-secondary/60 p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                placeholder="Paste code or configuration file here..."
              />
            </div>

            {/* Custom Rule Input with ReDoS validation */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Optional: Custom Regex Pattern
              </label>
              <Input
                value={customPattern}
                onChange={e => handlePatternChange(e.target.value)}
                placeholder="e.g. ACME_TOKEN_[A-Za-z0-9]{32}"
                className={cn('bg-secondary/50 font-mono text-xs h-9', regexValidation && !regexValidation.valid && 'border-red-500/50')}
              />
              {regexValidation && (
                <div className={cn(
                  'text-[11px] p-2 rounded-md border flex items-start gap-2',
                  regexValidation.valid
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-red-950/40 border-red-800/40 text-red-300'
                )}>
                  {regexValidation.valid ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                  <span>{regexValidation.valid ? 'ReDoS Safety Check Passed: Safe regex pattern structure.' : regexValidation.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Lab Results & Inspection */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card/60 p-5 min-h-[420px] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Detection Findings
                </h3>
                {scanResult && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {scanResult.findings.length} findings · {scanResult.duration}ms
                  </Badge>
                )}
              </div>

              {!scanResult ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6">
                  <FlaskConical className="w-10 h-10 mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No detection run yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Click <strong>Run Detection</strong> to analyze your sample snippet against built-in and custom intelligence rules.
                  </p>
                </div>
              ) : scanResult.findings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6">
                  <CheckCircle2 className="w-10 h-10 mb-3 text-primary" />
                  <p className="text-sm font-medium text-foreground">Clean Snippet: No Secrets Detected</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    The scanner engine found no matching patterns or high-entropy credentials above threshold.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scanResult.findings.map((f, idx) => (
                    <div key={idx} className="rounded-lg border border-border/60 bg-secondary/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm text-foreground">{f.name}</span>
                            <SeverityBadge severity={f.severity} size="sm" showIcon={false} />
                            <Badge variant="outline" className="text-[10px] font-mono border-border/50">
                              {f.confidence}% Confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{f.description}</p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
                          Line {f.line}
                        </span>
                      </div>

                      {/* Masked string value */}
                      <div className="rounded border border-border/40 bg-card/60 px-2.5 py-1.5 font-mono text-xs text-primary flex items-center justify-between">
                        <span>Masked: {f.maskedValue}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{f.ruleId}</span>
                      </div>

                      {/* Why Detected Signals */}
                      {f.whyDetected && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rationale:</span>
                          <div className="grid gap-1 pl-1">
                            {f.whyDetected.map((why, wIdx) => (
                              <div key={wIdx} className="text-xs flex items-center gap-1.5 text-foreground/80">
                                <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                                <span>{why}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Developer Quick Fix Preview */}
                      {f.quickFix && (
                        <div className="rounded border border-primary/20 bg-primary/5 p-2.5 space-y-1 text-xs">
                          <span className="font-semibold text-primary text-[11px]">Developer Quick Fix:</span>
                          <pre className="font-mono text-[11px] text-foreground/90 whitespace-pre overflow-x-auto">
                            {f.quickFix.afterSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
