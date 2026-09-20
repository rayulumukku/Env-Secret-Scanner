'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Send, CheckCircle2, AlertTriangle, ArrowLeft,
  ShieldCheck, Sparkles, FileCode, Clock, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { validateRegexSafety } from '@/lib/scanner/regex-safety';

export default function CommunityRulesPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    authorEmail: '',
    license: 'MIT',
    category: 'Cloud',
    provider: '',
    ruleId: '',
    ruleName: '',
    pattern: '',
    severity: 'HIGH',
    positiveFixtures: '',
    negativeFixtures: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [regexSafety, setRegexSafety] = useState({ valid: true });

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (formData.pattern.trim()) {
      const val = validateRegexSafety(formData.pattern.trim());
      setRegexSafety(val);
    }
  }, [formData.pattern]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rules/community');
      const data = await res.json();
      if (data.data) {
        setSubmissions(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.author || !formData.pattern || !formData.provider) {
      setError('Please fill in all required fields (Pack Name, Author, Provider, Pattern).');
      return;
    }

    if (!regexSafety.valid) {
      setError('Pattern failed ReDoS safety validation.');
      return;
    }

    const pos = formData.positiveFixtures.split('\n').map(s => s.trim()).filter(Boolean);
    const neg = formData.negativeFixtures.split('\n').map(s => s.trim()).filter(Boolean);

    const ruleObj = {
      id: formData.ruleId.trim() || `rule_${Date.now().toString(36)}`,
      name: formData.ruleName.trim() || formData.name,
      description: `Community detection rule for ${formData.provider}`,
      provider: formData.provider.trim(),
      category: formData.category,
      severity: formData.severity,
      confidence: 90,
      version: '1.0.0',
      patterns: [formData.pattern.trim()],
      testFixtures: {
        positive: pos.length > 0 ? pos : ['synthetic_sample_positive_key_12345'],
        negative: neg.length > 0 ? neg : ['synthetic_sample_negative_placeholder'],
      },
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rules/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: `Community rule pack for ${formData.provider}`,
          author: formData.author,
          authorEmail: formData.authorEmail,
          license: formData.license,
          rules: [ruleObj],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
        loadSubmissions();
      } else {
        setError(data.error?.message || 'Submission failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
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
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  COMMUNITY DETECTION ECOSYSTEM
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Open Contribution</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Contribute Detection Rules
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Submit declarative rule definitions for new cloud platforms, SaaS tokens, and developer tools.
              </p>
            </div>

            <Link href="/docs/rules/create">
              <Button variant="outline" size="sm" className="text-xs">
                Read Rule Guidelines &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Alert */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Confidentiality Requirement:</strong> Never submit live credentials or real secrets in test fixtures. All rule submissions undergo automated ReDoS scanning and peer review before publication.
          </div>
        </div>

        {/* Form or Success Box */}
        {submitSuccess ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Rule Submission Received</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your rule pack has been queued for automated fixture tests and security review. Once approved, it will be listed on the public Rule Marketplace.
            </p>
            <Button size="sm" onClick={() => setSubmitSuccess(false)} className="mt-2">
              Submit Another Rule
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              Rule Definition & Metadata
            </h2>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Pack / Rule Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Datadog API Key Detection"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Provider / Service *</label>
                <input
                  type="text"
                  required
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g. Datadog"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Author Name *</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Your Name or GitHub Handle"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Cloud">Cloud</option>
                  <option value="AI">AI</option>
                  <option value="Source Control">Source Control</option>
                  <option value="Payments">Payments</option>
                  <option value="Communication">Communication</option>
                  <option value="Databases">Databases</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="CI/CD">CI/CD</option>
                  <option value="Tokens">Tokens</option>
                  <option value="Generic Secrets">Generic Secrets</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Severity</label>
                <select
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Detection Regular Expression *</label>
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
              <input
                type="text"
                required
                value={formData.pattern}
                onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                placeholder="e.g. (?:datadog_api_key|dd_key)\s*[:=]\s*[a-f0-9]{32}"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Positive Test Fixtures (One per line)</label>
                <textarea
                  rows={3}
                  value={formData.positiveFixtures}
                  onChange={e => setFormData({ ...formData, positiveFixtures: e.target.value })}
                  placeholder="DD_API_KEY=11112222333344445555666677778888&#10;dd_key = 'aabbccddeeff00112233445566778899'"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Negative Test Fixtures (Should NOT match)</label>
                <textarea
                  rows={3}
                  value={formData.negativeFixtures}
                  onChange={e => setFormData({ ...formData, negativeFixtures: e.target.value })}
                  placeholder="DD_API_KEY=dummy_placeholder&#10;const notAKey = 'short';"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !regexSafety.valid}
              className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Submitting for Automated Review...' : 'Submit Rule to Community Review'}
            </Button>
          </form>
        )}

        {/* Submissions Review Queue / Status Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Community Submissions</h3>
            <Button variant="ghost" size="sm" onClick={loadSubmissions} className="text-xs gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                No community submissions logged yet. Be the first to contribute!
              </div>
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{sub.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">by {sub.author}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono whitespace-nowrap self-start sm:self-auto ${
                      sub.status === 'PUBLISHED'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : sub.status === 'APPROVED'
                        ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                        : 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                    }`}
                  >
                    {sub.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
