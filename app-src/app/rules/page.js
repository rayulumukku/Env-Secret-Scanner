'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { useCustomRules } from '@/lib/hooks/useCustomRules';
import { useToast } from '@/components/ui/use-toast';
import {
  Shield, Plus, Pencil, Trash2, Toggle3Right,
  Code2, AlertTriangle, CheckCircle2, X, Save, Info
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

function isValidRegex(pattern) {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function RuleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', pattern: '', severity: 'HIGH', category: 'Custom', enabled: true,
  });
  const [regexError, setRegexError] = useState('');

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.pattern.trim()) return 'Pattern is required';
    if (!isValidRegex(form.pattern)) return 'Invalid regular expression';
    return null;
  };

  const handlePatternChange = (val) => {
    setForm(f => ({ ...f, pattern: val }));
    if (val && !isValidRegex(val)) {
      setRegexError('Invalid regular expression');
    } else {
      setRegexError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setRegexError(err); return; }
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
          Regex Pattern *
        </label>
        <Input
          value={form.pattern}
          onChange={e => handlePatternChange(e.target.value)}
          placeholder="e.g. MYAPP_[A-Z0-9]{32}"
          className={cn('bg-secondary/50 h-8 text-sm font-mono', regexError && 'border-red-900/50')}
          required
        />
        {regexError && <p className="text-xs text-red-400 mt-1">{regexError}</p>}
        {form.pattern && !regexError && (
          <p className="text-xs text-primary mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Valid regex
          </p>
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
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </Button>
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
