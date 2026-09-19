'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { useCustomRules } from '@/lib/hooks/useCustomRules';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { validateRegexSafety } from '@/lib/scanner/regex-safety';
import {
  Shield, Plus, Pencil, Trash2, Toggle3Right,
  Code2, AlertTriangle, CheckCircle2, X, Save, Info, FlaskConical, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BUILT_IN_RULES = [
  { id: 'aws', name: 'AWS Credentials', category: 'Cloud', severity: 'CRITICAL', description: 'Access keys, secret keys, session tokens' },
  { id: 'github', name: 'GitHub Tokens', category: 'VCS', severity: 'CRITICAL', description: 'PATs, OAuth, App tokens' },
  { id: 'openai', name: 'OpenAI Keys', category: 'AI/ML', severity: 'CRITICAL', description: 'Project and legacy API keys' },
  { id: 'stripe', name: 'Stripe Keys', category: 'Payments', severity: 'CRITICAL', description: 'Live and test secret keys' },
  { id: 'google', name: 'Google APIs', category: 'Cloud', severity: 'HIGH', description: 'API keys, OAuth, service accounts' },
  { id: 'slack', name: 'Slack Tokens', category: 'Comms', severity: 'HIGH', description: 'Bot tokens, webhook URLs' },
  { id: 'jwt', name: 'JSON Web Tokens', category: 'Auth', severity: 'MEDIUM', description: 'Hardcoded JWTs' },
  { id: 'private-key', name: 'Private Keys', category: 'Crypto', severity: 'CRITICAL', description: 'RSA, EC, OpenSSH, PGP, PKCS#8' },
  { id: 'database', name: 'Database URLs', category: 'Database', severity: 'CRITICAL', description: 'Connection strings with credentials' },
  { id: 'generic', name: 'Generic Secrets', category: 'Generic', severity: 'HIGH', description: 'Passwords, API keys, bearer tokens, high-entropy' },
];

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function RuleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', pattern: '', severity: 'HIGH', category: 'Custom', enabled: true,
  });
  const [regexValidation, setRegexValidation] = useState(null);
  const [testSample, setTestSample] = useState('');
  const [testMatches, setTestMatches] = useState(null);

  const handlePatternChange = (val) => {
    setForm(f => ({ ...f, pattern: val }));
    if (val.trim()) {
      const v = validateRegexSafety(val.trim());
      setRegexValidation(v);
    } else {
      setRegexValidation(null);
    }
  };

  const handleTestMatch = () => {
    if (!form.pattern.trim() || !regexValidation?.valid) return;
    try {
      const re = new RegExp(form.pattern.trim(), 'g');
      const matches = testSample.match(re) || [];
      setTestMatches(matches);
    } catch {
      setTestMatches([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.pattern.trim()) return;
    const v = validateRegexSafety(form.pattern.trim());
    if (!v.valid) {
      setRegexValidation(v);
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rule Name *</label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Internal API Token"
            className="bg-secondary/50 h-8 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
          <Input
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Custom"
            className="bg-secondary/50 h-8 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Regex Pattern * (ReDoS Protected)
        </label>
        <Input
          value={form.pattern}
          onChange={e => handlePatternChange(e.target.value)}
          placeholder="e.g. MYAPP_[A-Z0-9]{32}"
          className={cn('bg-secondary/50 h-8 text-sm font-mono', regexValidation && !regexValidation.valid && 'border-red-900/50')}
          required
        />
        {regexValidation && (
          <div className={cn(
            'text-xs mt-1.5 flex items-center gap-1.5',
            regexValidation.valid ? 'text-primary' : 'text-red-400'
          )}>
            {regexValidation.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{regexValidation.valid ? 'ReDoS safe regex' : regexValidation.error}</span>
          </div>
        )}
      </div>

      {/* Inline Test Sandbox */}
      <div className="rounded-lg border border-border/40 bg-card/40 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-primary" />
            Quick Test Pattern
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[11px] gap-1 px-2"
            onClick={handleTestMatch}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            Test Match
          </Button>
        </div>
        <Input
          value={testSample}
          onChange={e => setTestSample(e.target.value)}
          placeholder="Paste synthetic sample text to test this rule..."
          className="bg-secondary/50 h-7 text-xs font-mono"
        />
        {testMatches !== null && (
          <div className="text-[11px] text-muted-foreground">
            {testMatches.length > 0 ? (
              <span className="text-primary font-medium">✓ Found {testMatches.length} match(es)</span>
            ) : (
              <span className="text-muted-foreground">No matches found in sample text</span>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
        <Input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="What does this rule detect?"
          className="bg-secondary/50 h-8 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Severity</label>
        <div className="flex gap-2 flex-wrap">
          {SEVERITY_OPTIONS.map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: sev }))}
              className={cn(
                'text-[10px] font-semibold px-2.5 py-1 rounded border uppercase tracking-wide transition-colors',
                form.severity === sev
                  ? sev === 'CRITICAL' ? 'bg-red-950/60 border-red-700 text-red-300'
                  : sev === 'HIGH' ? 'bg-orange-950/60 border-orange-700 text-orange-300'
                  : sev === 'MEDIUM' ? 'bg-yellow-950/60 border-yellow-700 text-yellow-300'
                  : 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : 'border-border/40 text-muted-foreground hover:border-border/70'
              )}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {initial ? 'Update Rule' : 'Add Rule'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function RulesPage() {
  const { rules, addRule, updateRule, deleteRule, toggleRule } = useCustomRules();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleAdd = (form) => {
    addRule(form);
    setShowForm(false);
    toast({ title: 'Rule added', description: `"${form.name}" is now active.` });
  };

  const handleUpdate = (form) => {
    updateRule(editingId, form);
    setEditingId(null);
    toast({ title: 'Rule updated' });
  };

  const handleDelete = (id, name) => {
    deleteRule(id);
    toast({ title: 'Rule deleted', description: `"${name}" has been removed.` });
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Detection Rules</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {BUILT_IN_RULES.length} built-in · {rules.length} custom
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/rules/lab">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                Rule Testing Lab
              </Button>
            </Link>
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule
            </Button>
          </div>
        </div>

        {/* Add rule form */}
        {showForm && !editingId && (
          <div className="mb-6">
            <RuleForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Custom rules */}
        {rules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Custom Rules
            </h2>
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id}>
                  {editingId === rule.id ? (
                    <RuleForm
                      initial={rule}
                      onSave={handleUpdate}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className={cn(
                      'rounded-xl border p-4 transition-colors',
                      rule.enabled ? 'border-border/50 bg-card/50' : 'border-border/30 bg-card/20 opacity-60'
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{rule.name}</span>
                            <SeverityBadge severity={rule.severity} showIcon={false} size="sm" />
                            <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">
                              {rule.category}
                            </Badge>
                            {!rule.enabled && (
                              <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/40">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                          <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                            {rule.pattern}
                          </code>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            title={rule.enabled ? 'Disable' : 'Enable'}
                          >
                            <CheckCircle2 className={cn('w-3.5 h-3.5', rule.enabled ? 'text-primary' : 'text-muted-foreground/30')} />
                          </button>
                          <button
                            onClick={() => { setEditingId(rule.id); setShowForm(false); }}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id, rule.name)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Built-in rules */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Built-in Rules
            <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground ml-1">Read-only</Badge>
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {BUILT_IN_RULES.map(rule => (
              <div
                key={rule.id}
                className="rounded-lg border border-border/30 bg-card/30 p-3 flex items-start gap-3"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium">{rule.name}</span>
                    <SeverityBadge severity={rule.severity} showIcon={false} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 rounded-lg border border-border/30 bg-card/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>
            Custom rules are applied in addition to built-in rules. Regex patterns are validated before saving.
            Be careful with complex patterns — avoid catastrophic backtracking.
          </span>
        </div>
      </div>
    </div>
  );
}
