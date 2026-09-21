'use client';

/**
 * app/trust/reports/new/page.js
 *
 * Interactive Trust & Compliance Report Generator.
 * Select report type, output format, sections to include, scope,
 * and preview/export audit-ready packets.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Shield,
  Download,
  CheckCircle2,
  Lock,
  Eye,
  ArrowLeft,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

const REPORT_TYPES = [
  {
    id: 'SECURITY_OVERVIEW',
    title: 'Security Overview Report',
    desc: 'High-level architecture, encryption standards, authentication models, and posture metrics.',
  },
  {
    id: 'CONTROL_EVIDENCE',
    title: 'Control Evidence Report',
    desc: 'Comprehensive mapping of all implemented controls linked with integrity-verified evidence.',
  },
  {
    id: 'QUESTIONNAIRE',
    title: 'Customer Security Questionnaire',
    desc: 'Evidence-backed answers to 12 standard vendor assessment questionnaire categories.',
  },
  {
    id: 'INCIDENT_EVIDENCE',
    title: 'Incident Evidence Report',
    desc: 'Timeline of operational incidents, containment records, and lessons learned without raw secrets.',
  },
  {
    id: 'ACCESS_REVIEW',
    title: 'Access Review Report',
    desc: 'Periodic governance audit of organization members, repository permissions, and credentials.',
  },
  {
    id: 'AI_PRIVACY',
    title: 'AI Privacy & Data Handling Report',
    desc: 'Factual declaration of deterministic offline scanning, secret redaction, and zero model training.',
  },
  {
    id: 'INTEGRATION_SECURITY',
    title: 'Integration Security Report',
    desc: 'Audit of connected CI/CD tools, webhook verification signatures, and least-privilege scopes.',
  },
];

const AVAILABLE_SECTIONS = [
  'Executive Summary',
  'Security Architecture & Deployment Model',
  'Data Handling & Storage Encryption (AES-256-GCM)',
  'Authentication & Role-Based Access Control',
  'Audit Logging & Continuous Event Monitoring',
  'Vulnerability Management & CI/CD Pipeline Gates',
  'Incident Response & Playbook Automation',
  'Data Retention & Deletion Verification',
  'Third-Party Integration & Webhook Security',
  'AI Privacy & Data Minimization Guarantees',
];

export default function NewTrustReportPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState('SECURITY_OVERVIEW');
  const [title, setTitle] = useState('SecretShield Security Overview Report');
  const [scope, setScope] = useState('Organization Wide');
  const [format, setFormat] = useState('html');
  const [selectedSections, setSelectedSections] = useState(AVAILABLE_SECTIONS.slice(0, 6));
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  function toggleSection(sec) {
    if (selectedSections.includes(sec)) {
      setSelectedSections(selectedSections.filter(s => s !== sec));
    } else {
      setSelectedSections([...selectedSections, sec]);
    }
  }

  async function handleGenerateReport(downloadImmediately = false) {
    try {
      setGenerating(true);
      setErrorMsg(null);

      const payload = {
        reportType,
        title,
        scope,
        format,
        sections: selectedSections,
        download: downloadImmediately,
      };

      const res = await fetch('/api/trust/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to generate report');
      }

      if (downloadImmediately && format === 'html') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trust-report-${reportType.toLowerCase()}-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        router.push('/trust/reports');
      } else {
        const json = await res.json();
        if (json.success) {
          router.push('/trust/reports');
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/trust/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports Archive
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="w-8 h-8 text-cyan-400" />
              Generate Compliance Report
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Create a sanitized, evidence-backed security packet customized for enterprise customer reviews or audit documentation.
            </p>
          </div>
        </div>
      </div>

      <TrustNav />

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Select Report Type */}
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">1. Select Report Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REPORT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setReportType(t.id);
                      setTitle(`SecretShield ${t.title}`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      reportType === t.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 bg-background/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="font-semibold text-xs text-foreground">{t.title}</div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Metadata & Scope */}
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">2. Report Details & Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Report Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Evaluation Scope</label>
                  <input
                    type="text"
                    value={scope}
                    onChange={e => setScope(e.target.value)}
                    className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Output Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="html">PDF-Compatible HTML Document</option>
                    <option value="json">Machine-Readable JSON Package</option>
                    <option value="csv">Standardized CSV Data Table</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Select Sections */}
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">3. Select Report Sections to Include</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_SECTIONS.map((sec, idx) => {
                  const isChecked = selectedSections.includes(sec);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSection(sec)}
                      className={`p-2.5 rounded-lg border text-left text-xs flex items-center gap-2 transition-all ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-foreground font-medium'
                          : 'border-border/60 bg-background/50 text-muted-foreground'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${isChecked ? 'text-emerald-400' : 'text-muted-foreground/40'}`}
                      />
                      <span className="truncate">{sec}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action & Preview Summary Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Sanitization & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Automated secret sanitizer (masks any candidate tokens).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero raw credentials in payload or evidence records.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>SHA-256 canonical integrity hash stamped on export.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Factual technical control disclaimer included automatically.</span>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button
                  className="w-full text-xs gap-1.5"
                  onClick={() => handleGenerateReport(false)}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Save & Archive Report'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs gap-1.5"
                  onClick={() => handleGenerateReport(true)}
                  disabled={generating}
                >
                  <Download className="w-3.5 h-3.5" />
                  Generate & Download Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
