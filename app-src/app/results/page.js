'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from '@/components/results/SummaryCards';
import { FindingsTable } from '@/components/results/FindingsTable';
import { useAllowlist } from '@/lib/hooks/useCustomRules';
import { useToast } from '@/components/ui/use-toast';
import {
  Shield, ArrowLeft, Download, Share2, EyeOff,
  CheckCircle2, AlertTriangle, RotateCcw
} from 'lucide-react';


export default function ResultsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addFingerprint } = useAllowlist();

  const [scanResult, setScanResult] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('secretshield_last_scan');
      if (stored) {
        setScanResult(JSON.parse(stored));
      }
    } catch {
      // parse error
    }
    setIsLoaded(true);
  }, []);

  const handleMarkFalsePositive = (finding) => {
    addFingerprint(finding.fingerprint, 'marked as false positive');
    setScanResult(prev => ({
      ...prev,
      findings: prev.findings.filter(f => f.fingerprint !== finding.fingerprint),
      allowlistedFindings: [...(prev.allowlistedFindings || []), { ...finding, isAllowlisted: true }],
      stats: {
        ...prev.stats,
        totalFindings: prev.stats.totalFindings - 1,
        allowlisted: (prev.stats.allowlisted || 0) + 1,
        [finding.severity?.toLowerCase()]: Math.max(0, (prev.stats[finding.severity?.toLowerCase()] || 0) - 1),
      },
    }));
    toast({ title: 'Marked as false positive', description: `${finding.name} added to allowlist.` });
  };

  const handleIgnorePattern = (finding) => {
    addFingerprint(finding.fingerprint);
    setScanResult(prev => ({
      ...prev,
      findings: prev.findings.filter(f => f.fingerprint !== finding.fingerprint),
      stats: {
        ...prev.stats,
        totalFindings: prev.stats.totalFindings - 1,
        allowlisted: (prev.stats.allowlisted || 0) + 1,
      },
    }));
    toast({ title: 'Pattern ignored', description: 'This finding will not appear in future scans.' });
  };

  const handleExport = () => {
    if (!scanResult) return;
    const exportData = {
      id: scanResult.id,
      timestamp: scanResult.timestamp,
      stats: scanResult.stats,
      findings: (scanResult.findings || []).map(f => ({
        type: f.type,
        name: f.name,
        severity: f.severity,
        file: f.file,
        line: f.line,
        maskedValue: f.maskedValue,
        confidence: f.confidence,
        fingerprint: f.fingerprint,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secretshield-${scanResult.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report exported', description: 'Masked findings exported as JSON.' });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading results…</div>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-lg font-semibold mb-2">No scan results found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Run a scan first to see results here.
          </p>
          <Link href="/scan">
            <Button className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Start a New Scan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { stats, findings = [], allowlistedFindings = [], isDemo } = scanResult;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/scan" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold">Scan Results</h1>
              {isDemo && (
                <Badge variant="outline" className="border-amber-800/50 text-amber-400 bg-amber-950/30 text-xs">
                  ⚠ Demo — NOT REAL
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              ID: {scanResult.id} · {new Date(scanResult.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs border-border/60"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </Button>
            <Link href="/scan">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/60">
                <RotateCcw className="w-3.5 h-3.5" />
                New Scan
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <SummaryCards stats={stats} duration={stats?.duration} className="mb-6" />

        {/* No findings */}
        {findings.length === 0 && allowlistedFindings.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card/50 p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" />
            <h2 className="text-lg font-semibold mb-2">No secrets detected</h2>
            <p className="text-muted-foreground text-sm">
              All {stats?.filesScanned} file{stats?.filesScanned !== 1 ? 's' : ''} passed the scan.
            </p>
          </div>
        )}

        {/* Findings tabs */}
        {(findings.length > 0 || allowlistedFindings.length > 0) && (
          <Tabs defaultValue="findings" className="space-y-4">
            <TabsList className="bg-secondary/30 border border-border/30">
              <TabsTrigger value="findings" className="gap-1.5 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <AlertTriangle className="w-3.5 h-3.5" />
                Findings ({findings.length})
              </TabsTrigger>
              {allowlistedFindings.length > 0 && (
                <TabsTrigger value="allowlisted" className="gap-1.5 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <EyeOff className="w-3.5 h-3.5" />
                  Allowlisted ({allowlistedFindings.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="findings">
              <FindingsTable
                findings={findings}
                isDemo={isDemo}
                onMarkFalsePositive={handleMarkFalsePositive}
                onIgnorePattern={handleIgnorePattern}
              />
            </TabsContent>

            {allowlistedFindings.length > 0 && (
              <TabsContent value="allowlisted">
                <div className="rounded-xl border border-border/50 bg-card/30 p-4 mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <EyeOff className="w-4 h-4 flex-shrink-0" />
                  These findings are ignored based on your allowlist settings.
                </div>
                <FindingsTable
                  findings={allowlistedFindings}
                  isDemo={isDemo}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
}
