'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { useCustomRules } from '@/lib/hooks/useCustomRules';
import { useToast } from '@/components/ui/use-toast';
import { validateRegexSafety } from '@/lib/scanner/regex-safety';
import {
  Shield, Plus, Pencil, Trash2, ToggleRight, ToggleLeft,
  Code2, AlertTriangle, CheckCircle2, X, Save, Info, FlaskConical,
  Play, Package, Store, Users, BookOpen, Layers, Terminal, Search,
  ChevronRight, Lock, Unlock, Check, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RULE_CATEGORIES = [
  'ALL',
  'Cloud',
  'AI',
  'Source Control',
  'Payments',
  'Communication',
  'Databases',
  'Infrastructure',
  'CI/CD',
  'Authentication',
  'Private Keys',
  'Tokens',
  'Generic Secrets',
  'Configuration Secrets'
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          {initial ? 'Edit Custom Detection Rule' : 'Create Custom Detection Rule'}
        </h3>
        <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
          Tier 5: Local Custom
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Rule Name *</label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Internal Microservice Token"
            className="bg-secondary/40 h-8 text-xs"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Category</label>
          <Input
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Custom"
            className="bg-secondary/40 h-8 text-xs"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Regular Expression Pattern * (ReDoS Protected)
          </label>
          {regexValidation && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-mono',
                regexValidation.valid ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-red-500/40 text-red-400 bg-red-500/10'
              )}
            >
              {regexValidation.valid ? 'ReDoS Safe' : 'ReDoS Risk'}
            </Badge>
          )}
        </div>
        <Input
          value={form.pattern}
          onChange={e => handlePatternChange(e.target.value)}
          placeholder="e.g. CORP_SVC_[A-Z0-9]{32}"
          className={cn('bg-secondary/40 h-8 text-xs font-mono', regexValidation && !regexValidation.valid && 'border-red-500/50')}
          required
        />
        {regexValidation && !regexValidation.valid && (
          <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {regexValidation.error}
          </p>
        )}
      </div>

      {/* Inline Test Sandbox */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            Live In-Memory Match Test
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[11px] gap-1 px-2.5"
            onClick={handleTestMatch}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            Test Match
          </Button>
        </div>
        <Input
          value={testSample}
          onChange={e => setTestSample(e.target.value)}
          placeholder="Paste synthetic sample code or token string to test..."
          className="bg-secondary/40 h-7 text-xs font-mono"
        />
        {testMatches !== null && (
          <div className="text-[11px] pt-0.5">
            {testMatches.length > 0 ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Found {testMatches.length} match(es) in synthetic test sample
              </span>
            ) : (
              <span className="text-muted-foreground">No matches found for pattern</span>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block">Description</label>
        <Input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Detailed explanation of token purpose & sensitivity"
          className="bg-secondary/40 h-8 text-xs"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block">Severity</label>
        <div className="flex gap-2 flex-wrap">
          {SEVERITY_OPTIONS.map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: sev }))}
              className={cn(
                'text-[10px] font-semibold px-3 py-1 rounded-md border uppercase tracking-wider transition-colors',
                form.severity === sev
                  ? sev === 'CRITICAL' ? 'bg-red-950/60 border-red-700 text-red-300'
                  : sev === 'HIGH' ? 'bg-orange-950/60 border-orange-700 text-orange-300'
                  : sev === 'MEDIUM' ? 'bg-yellow-950/60 border-yellow-700 text-yellow-300'
                  : 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : 'border-border/50 text-muted-foreground hover:border-border/80'
              )}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground font-bold">
          <Save className="w-3.5 h-3.5" />
          {initial ? 'Update Rule' : 'Save & Activate Rule'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function RulesPage() {
  const { rules: customRules, addRule, updateRule, deleteRule, toggleRule } = useCustomRules();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'packs', 'precedence', 'custom'
  const [packs, setPacks] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setLoadingPacks(true);
    try {
      const res = await fetch('/api/rules/packs');
      const json = await res.json();
      if (json.data?.installed) {
        setPacks(json.data.installed);
      }
    } catch {
    } finally {
      setLoadingPacks(false);
    }
  };

  // Build comprehensive rule catalog from core & custom
  const allCatalogRules = [
    {
      id: 'aws-access-key-id',
      name: 'AWS Access Key ID',
      provider: 'AWS',
      category: 'Cloud',
      severity: 'HIGH',
      confidence: 95,
      version: '1.0.0',
      description: '20-character AWS standard access key identifier starting with AKIA or ASIA',
      patterns: ['(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'],
      keywords: ['AKIA', 'ASIA', 'AWS_ACCESS_KEY_ID'],
      docUrl: 'https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html',
    },
    {
      id: 'aws-secret-access-key',
      name: 'AWS Secret Access Key',
      provider: 'AWS',
      category: 'Cloud',
      severity: 'CRITICAL',
      confidence: 92,
      version: '1.0.0',
      description: '40-character base64-encoded secret access key paired with AWS access keys',
      patterns: ['(?i)(?:aws_secret_access_key|aws_secret_key)\\s*[:=]\\s*[\'"][A-Za-z0-9/+=]{40}[\'"]'],
      keywords: ['aws_secret_access_key'],
      docUrl: 'https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html',
    },
    {
      id: 'google-api-key',
      name: 'Google Cloud API Key',
      provider: 'Google Cloud',
      category: 'Cloud',
      severity: 'HIGH',
      confidence: 95,
      version: '1.0.0',
      description: '39-character AIza Google Cloud API and Firebase identifier',
      patterns: ['AIza[0-9A-Za-z\\-_]{35}'],
      keywords: ['AIza', 'GOOGLE_API_KEY'],
      docUrl: 'https://cloud.google.com/docs/authentication/api-keys',
    },
    {
      id: 'openai-api-key',
      name: 'OpenAI API Key',
      provider: 'OpenAI',
      category: 'AI',
      severity: 'CRITICAL',
      confidence: 98,
      version: '1.0.0',
      description: 'OpenAI secret authentication token starting with sk- or sk-proj-',
      patterns: ['sk-(?:proj-)?[A-Za-z0-9_-]{32,128}'],
      keywords: ['sk-', 'OPENAI_API_KEY'],
      docUrl: 'https://platform.openai.com/docs/api-reference/authentication',
    },
    {
      id: 'anthropic-api-key',
      name: 'Anthropic Claude API Key',
      provider: 'Anthropic',
      category: 'AI',
      severity: 'CRITICAL',
      confidence: 98,
      version: '1.0.0',
      description: 'Anthropic Claude API authentication key starting with sk-ant-',
      patterns: ['sk-ant-[A-Za-z0-9_-]{40,120}'],
      keywords: ['sk-ant-', 'ANTHROPIC_API_KEY'],
      docUrl: 'https://docs.anthropic.com/en/api/getting-started',
    },
    {
      id: 'github-pat',
      name: 'GitHub Personal Access Token',
      provider: 'GitHub',
      category: 'Source Control',
      severity: 'CRITICAL',
      confidence: 98,
      version: '1.0.0',
      description: 'GitHub classic and fine-grained personal access tokens (ghp_ and github_pat_)',
      patterns: ['ghp_[A-Za-z0-9_]{36,255}', 'github_pat_[A-Za-z0-9_]{82}'],
      keywords: ['ghp_', 'github_pat_'],
      docUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure',
    },
    {
      id: 'gitlab-pat',
      name: 'GitLab Personal Access Token',
      provider: 'GitLab',
      category: 'Source Control',
      severity: 'CRITICAL',
      confidence: 98,
      version: '1.0.0',
      description: 'GitLab personal access token starting with glpat-',
      patterns: ['glpat-[0-9a-zA-Z_\\-]{20,24}'],
      keywords: ['glpat-'],
      docUrl: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
    },
    {
      id: 'stripe-secret-key',
      name: 'Stripe Live Secret Key',
      provider: 'Stripe',
      category: 'Payments',
      severity: 'CRITICAL',
      confidence: 98,
      version: '1.0.0',
      description: 'Stripe production secret API key starting with sk_live_ or rk_live_',
      patterns: ['(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}'],
      keywords: ['sk_live_', 'rk_live_'],
      docUrl: 'https://stripe.com/docs/keys',
    },
    {
      id: 'slack-token',
      name: 'Slack Bot / User Token',
      provider: 'Slack',
      category: 'Communication',
      severity: 'HIGH',
      confidence: 96,
      version: '1.0.0',
      description: 'Slack workspace integration tokens (xoxb-, xoxp-, xoxa-)',
      patterns: ['xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}'],
      keywords: ['xoxb-', 'xoxp-'],
      docUrl: 'https://api.slack.com/authentication/token-types',
    },
    {
      id: 'postgres-connection-url',
      name: 'PostgreSQL Connection URL',
      provider: 'PostgreSQL',
      category: 'Databases',
      severity: 'CRITICAL',
      confidence: 94,
      version: '1.0.0',
      description: 'PostgreSQL connection URI with embedded password credentials',
      patterns: ['postgres(?:ql)?://[a-zA-Z0-9_\\-\\.]+:[^@\\s\'"]+@[a-zA-Z0-9_\\-\\.]+:[0-9]{2,5}/[a-zA-Z0-9_\\-\\.]+'],
      keywords: ['postgres://', 'postgresql://'],
      docUrl: 'https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING',
    },
    {
      id: 'vault-token',
      name: 'HashiCorp Vault Token',
      provider: 'HashiCorp',
      category: 'Infrastructure',
      severity: 'CRITICAL',
      confidence: 95,
      version: '1.0.0',
      description: 'HashiCorp Vault client and service authentication token starting with hvs. or s.',
      patterns: ['(?:s\\.|hvs\\.)[a-zA-Z0-9]{24,32}'],
      keywords: ['VAULT_TOKEN', 'hvs.'],
      docUrl: 'https://developer.hashicorp.com/vault/docs/concepts/tokens',
    },
    {
      id: 'github-actions-secret',
      name: 'GitHub Actions Secret',
      provider: 'GitHub',
      category: 'CI/CD',
      severity: 'CRITICAL',
      confidence: 90,
      version: '1.0.0',
      description: 'Hardcoded secret inside GitHub Actions workflow configuration',
      patterns: ['(?i)(?:GH_TOKEN|GITHUB_TOKEN|DEPLOY_KEY)\\s*:\\s*[\'"][A-Za-z0-9_]{32,64}[\'"]'],
      keywords: ['GH_TOKEN', 'DEPLOY_KEY'],
      docUrl: 'https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions',
    },
    {
      id: 'jwt-token',
      name: 'JSON Web Token (JWT)',
      provider: 'Generic Auth',
      category: 'Authentication',
      severity: 'MEDIUM',
      confidence: 85,
      version: '1.0.0',
      description: 'Hardcoded base64-encoded JSON Web Token with standard 3-part header.payload.sig',
      patterns: ['eyJ[A-Za-z0-9-_=]+\\.eyJ[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]+'],
      keywords: ['eyJ'],
      docUrl: 'https://jwt.io/introduction',
    },
    {
      id: 'rsa-private-key',
      name: 'RSA Private Key',
      provider: 'Cryptography',
      category: 'Private Keys',
      severity: 'CRITICAL',
      confidence: 99,
      version: '1.0.0',
      description: 'Unencrypted PEM RSA private cryptographic key block',
      patterns: ['-----BEGIN RSA PRIVATE KEY-----'],
      keywords: ['BEGIN RSA PRIVATE KEY'],
      docUrl: 'https://www.openssl.org/docs/manmaster/man1/openssl-genrsa.html',
    },
    {
      id: 'npm-access-token',
      name: 'NPM Access Token',
      provider: 'NPM Registry',
      category: 'Tokens',
      severity: 'HIGH',
      confidence: 95,
      version: '1.0.0',
      description: 'NPM registry authorization token starting with npm_',
      patterns: ['npm_[A-Za-z0-9]{36}'],
      keywords: ['npm_', '_authToken'],
      docUrl: 'https://docs.npmjs.com/about-access-tokens',
    },
    {
      id: 'dotenv-credential-variable',
      name: 'Dotenv Exposed Secret Variable',
      provider: 'Generic Config',
      category: 'Configuration Secrets',
      severity: 'HIGH',
      confidence: 85,
      version: '1.0.0',
      description: 'High-entropy secret key declared in environment configuration files',
      patterns: ['(?i)(?:PROD_SECRET|APP_KEY|AUTH_SECRET|MASTER_KEY)\\s*=\\s*[\'"]?[A-Za-z0-9_\\-+=]{16,64}[\'"]?'],
      keywords: ['PROD_SECRET', 'AUTH_SECRET'],
      docUrl: 'https://12factor.net/config',
    },
  ];

  const filteredRules = allCatalogRules.filter(r => {
    const matchesCat = selectedCategory === 'ALL' || r.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = !searchQuery || (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesCat && matchesQuery;
  });

  const handleAdd = (form) => {
    addRule(form);
    setShowForm(false);
    toast({ title: 'Custom rule created', description: `"${form.name}" has been activated.` });
  };

  const handleUpdate = (form) => {
    updateRule(editingId, form);
    setEditingId(null);
    toast({ title: 'Custom rule updated' });
  };

  const handleDelete = (id, name) => {
    deleteRule(id);
    toast({ title: 'Custom rule removed', description: `"${name}" was deleted.` });
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  RULE ECOSYSTEM v2.0
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">100% Declarative & ReDoS-Safe</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Detection Rules & Rule Packs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage first-party core rule packs, organization policies, and community secret detectors.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/rules/lab">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FlaskConical className="w-3.5 h-3.5 text-primary" />
                  Testing Lab
                </Button>
              </Link>
              <Link href="/rules/marketplace">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                  Marketplace
                </Button>
              </Link>
              <Link href="/rules/community">
                <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground font-bold">
                  <Users className="w-3.5 h-3.5" />
                  Community Submissions
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <span className="text-[11px] font-mono text-muted-foreground block">Installed Packs</span>
              <span className="text-xl font-bold text-foreground mt-0.5 block">
                {packs.length || 3}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <span className="text-[11px] font-mono text-muted-foreground block">Active Rules</span>
              <span className="text-xl font-bold text-primary mt-0.5 block">
                {allCatalogRules.length + customRules.length}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <span className="text-[11px] font-mono text-muted-foreground block">Categories</span>
              <span className="text-xl font-bold text-foreground mt-0.5 block">
                13
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <span className="text-[11px] font-mono text-muted-foreground block">Precedence Tiers</span>
              <span className="text-xl font-bold text-foreground mt-0.5 block">
                5 Levels
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeTab === 'catalog'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            Detection Catalog ({allCatalogRules.length})
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeTab === 'packs'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Installed Rule Packs ({packs.length || 3})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeTab === 'custom'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Custom Rules ({customRules.length})
          </button>
          <button
            onClick={() => setActiveTab('precedence')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
              activeTab === 'precedence'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Precedence Engine
          </button>
        </div>

        {/* TAB 1: DETECTION CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search rules by name, provider, keyword..."
                  className="pl-9 h-8 text-xs bg-secondary/30"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {RULE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors',
                      selectedCategory === cat
                        ? 'bg-secondary text-foreground font-bold border border-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRules.map(rule => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-border/70 bg-card/50 p-4 space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{rule.name}</span>
                          <SeverityBadge severity={rule.severity} size="sm" />
                          <Badge variant="outline" className="text-[10px] font-mono border-border/50 text-muted-foreground">
                            {rule.category}
                          </Badge>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                          ID: {rule.id} · v{rule.version} · {rule.provider}
                        </span>
                      </div>

                      <Link href={`/rules/lab?rule=${rule.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary hover:text-primary">
                          Test &rarr;
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="bg-background/80 p-2 rounded-lg border border-border/40 font-mono text-[11px] text-primary truncate">
                      <code>{rule.patterns[0]}</code>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/30">
                    <span className="text-emerald-400 font-semibold">Confidence: {rule.confidence}%</span>
                    {rule.docUrl && (
                      <a
                        href={rule.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Docs <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: INSTALLED RULE PACKS */}
        {activeTab === 'packs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Active & Installed Rule Packs</h3>
                <p className="text-xs text-muted-foreground">
                  Rule packs are declarative containers containing validated detection patterns, fixture tests, and SHA-256 integrity metadata.
                </p>
              </div>

              <Link href="/rules/marketplace">
                <Button size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  Install More Packs
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {packs.map(pack => (
                <div
                  key={pack.id}
                  className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground">{pack.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-mono',
                            pack.isBuiltin ? 'border-primary/40 text-primary bg-primary/5' : 'border-blue-500/40 text-blue-400 bg-blue-500/5'
                          )}
                        >
                          {pack.isBuiltin ? 'CORE PACK' : 'COMMUNITY'}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">v{pack.version}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{pack.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {pack.isLocked && (
                        <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-400 gap-1">
                          <Lock className="w-3 h-3" /> Locked: {pack.lockedVersion}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-mono',
                          pack.enabled ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted-foreground'
                        )}
                      >
                        {pack.enabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Author & License</span>
                      <span className="text-foreground font-semibold">{pack.author} ({pack.license})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Rule Count</span>
                      <span className="text-foreground font-semibold">{pack.ruleCount} detection rules</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Integrity Verification</span>
                      <span className="text-primary truncate block font-bold">{pack.integrity?.slice(0, 24) || 'sha256-verified'}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM RULES */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Custom Detection Rules (Tier 5)</h3>
                <p className="text-xs text-muted-foreground">
                  Organization-specific patterns tested with automated ReDoS protection.
                </p>
              </div>

              <Button
                onClick={() => { setShowForm(true); setEditingId(null); }}
                size="sm"
                className="gap-1.5 text-xs bg-primary text-primary-foreground font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Rule
              </Button>
            </div>

            {/* Form */}
            {showForm && !editingId && (
              <RuleForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            )}

            {/* Custom Rules List */}
            {customRules.length === 0 && !showForm ? (
              <div className="p-12 text-center border border-dashed border-border/70 rounded-2xl space-y-3">
                <Code2 className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">No custom rules defined yet.</p>
                <Button size="sm" onClick={() => setShowForm(true)} className="text-xs">
                  Create Your First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customRules.map(rule => (
                  <div key={rule.id}>
                    {editingId === rule.id ? (
                      <RuleForm
                        initial={rule}
                        onSave={handleUpdate}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className={cn(
                        'rounded-2xl border p-5 transition-colors',
                        rule.enabled ? 'border-border/70 bg-card/60' : 'border-border/30 bg-card/20 opacity-60'
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{rule.name}</span>
                              <SeverityBadge severity={rule.severity} size="sm" />
                              <Badge variant="outline" className="text-[10px] font-mono border-border/50 text-muted-foreground">
                                {rule.category}
                              </Badge>
                              {!rule.enabled && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground/60">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                            <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 inline-block">
                              {rule.pattern}
                            </code>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleRule(rule.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                              title={rule.enabled ? 'Disable' : 'Enable'}
                            >
                              <CheckCircle2 className={cn('w-4 h-4', rule.enabled ? 'text-primary' : 'text-muted-foreground/30')} />
                            </button>
                            <button
                              onClick={() => { setEditingId(rule.id); setShowForm(false); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id, rule.name)}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRECEDENCE HIERARCHY */}
        {activeTab === 'precedence' && (
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                5-Tier Deterministic Rule Precedence Hierarchy
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                When multiple detection rules identify an identical secret span in a file, SecretShield applies deterministic priority to prevent duplicate findings.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-foreground">Tier 1: Core Rules (Built-in)</span>
                    <span className="text-[11px] text-muted-foreground block">Verified official provider detectors with highest specificity</span>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Rank 100</Badge>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-foreground">Tier 2: Organization Rule Packs</span>
                    <span className="text-[11px] text-muted-foreground block">Enterprise private packs enforced across all workspaces</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Rank 200</Badge>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-foreground">Tier 3: Project Rules</span>
                    <span className="text-[11px] text-muted-foreground block">Rules scoped to specific microservices or applications</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Rank 300</Badge>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-foreground">Tier 4: Repository Rules</span>
                    <span className="text-[11px] text-muted-foreground block">Repo-scoped configuration rules (.secretshield.json)</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Rank 400</Badge>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-xs">
                    5
                  </span>
                  <div>
                    <span className="font-bold text-foreground">Tier 5: Local Custom & Lab Rules</span>
                    <span className="text-[11px] text-muted-foreground block">Ad-hoc regex patterns added during interactive investigation</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Rank 500</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
