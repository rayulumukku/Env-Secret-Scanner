'use client';

/**
 * app/trust/page.js
 *
 * Enterprise Trust, Compliance & Security Evidence Center Hub for SecretShield.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  Users,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Activity,
  Server,
  Zap,
  Clock,
  Download,
  AlertCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TrustCenterOverviewPage() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchControls();
  }, []);

  async function fetchControls() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/controls');
      const json = await res.json();
      if (json.success) {
        setControls(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const implementedCount = controls.filter(c => c.implementationStatus === 'IMPLEMENTED').length;
  const partialCount = controls.filter(c => c.implementationStatus === 'PARTIALLY_IMPLEMENTED').length;

  const trustSections = [
    {
      title: 'Security Controls',
      desc: 'Normalized baseline controls across encryption, authentication, and secret handling.',
      icon: <Lock className="w-5 h-5 text-primary" />,
      link: '/trust/controls',
      count: `${implementedCount} Implemented`,
    },
    {
      title: 'Evidence Records',
      desc: 'Tamper-proof evidence snapshots with SHA-256 integrity hashes.',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      link: '/trust/evidence',
      count: 'Verifiable',
    },
    {
      title: 'Security Questionnaire',
      desc: 'Evidence-backed answers across 12 standard vendor review categories.',
      icon: <HelpCircle className="w-5 h-5 text-cyan-400" />,
      link: '/trust/questionnaire',
      count: '12 Categories',
    },
    {
      title: 'Access Reviews',
      desc: 'Periodic governance reviews for members, roles, repositories, and tokens.',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      link: '/trust/access-reviews',
      count: 'RBAC Governed',
    },
    {
      title: 'Data Flow Map',
      desc: 'Visual architecture showing data processing boundaries and offline scanning.',
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      link: '/trust/data-flow',
      count: 'Architecture',
    },
    {
      title: 'AI Privacy Center',
      desc: 'Data minimization, deterministic offline fallback, and secret redaction.',
      icon: <Cpu className="w-5 h-5 text-amber-400" />,
      link: '/trust/ai',
      count: 'Zero Retention',
    },
    {
      title: 'Data Retention',
      desc: 'Configured retention policies and automated cleanup verification.',
      icon: <Clock className="w-5 h-5 text-orange-400" />,
      link: '/trust/retention',
      count: 'Configurable',
    },
    {
      title: 'Trust Reports',
      desc: 'Sanitized PDF/HTML customer-shareable security and evidence packages.',
      icon: <Download className="w-5 h-5 text-emerald-400" />,
      link: '/trust/reports',
      count: 'Exportable',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Trust & Compliance</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Enterprise Trust & Security Evidence Center</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Verifiable security controls, immutable evidence records, customer questionnaires, and automated compliance reports.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/trust/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Compliance Dashboard
                </Button>
              </Link>
              <Link href="/trust/reports/new">
                <Button size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Generate Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Transparency Banner */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-300">Evidence-Backed Security Posture:</span>{' '}
            <span className="text-muted-foreground">
              All statements in this Trust Center reflect documented technical controls and collected evidence records. SecretShield does not make unsupported compliance claims or certification assertions.
            </span>
          </div>
        </div>

        {/* High-Level Posture Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground">Documented Controls</span>
              <p className="text-2xl font-bold">{controls.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground">Implemented</span>
              <p className="text-2xl font-bold text-emerald-400">{implementedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground">Partial / Planned</span>
              <p className="text-2xl font-bold text-amber-400">{partialCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground">Raw Secrets Stored</span>
              <p className="text-2xl font-bold text-emerald-400">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustSections.map((sec) => (
            <Link key={sec.title} href={sec.link}>
              <Card className="border-border/60 bg-card/60 hover:bg-muted/10 hover:border-primary/40 transition-all h-full cursor-pointer">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-md bg-muted border border-border/60">
                        {sec.icon}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {sec.count}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground pt-1">{sec.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sec.desc}</p>
                  </div>
                  <div className="flex items-center text-xs text-primary font-medium gap-1 pt-2">
                    <span>Explore section</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
