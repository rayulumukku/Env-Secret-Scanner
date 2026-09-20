import Link from 'next/link';
import {
  Tag, Download, CheckCircle2, ArrowLeft, Terminal,
  Shield, FileCode, AlertTriangle, ArrowRight, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Release Notes & Migration Guides — SecretShield',
  description: 'Detailed release notes, migration guides, and download artifacts for SecretShield.',
};

export default function ReleasesPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/changelog">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Changelog
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  CURRENT RELEASE
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">v1.0.0 (Stable)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Release Notes & Migration Guide
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Comprehensive deployment guide, breaking changes, and installation packages.
              </p>
            </div>
          </div>
        </div>

        {/* Installation & Packages Box */}
        <div className="bg-card/60 border border-border/70 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Distribution Packages & CLI
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">NPM Global CLI</span>
                <Badge variant="outline" className="text-[10px] font-mono">npm</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Universal Node.js runtime runner for macOS, Linux, and Windows.</p>
              <div className="bg-background/80 p-2 rounded border border-border/40 font-mono text-xs text-primary">
                npm install -g @secretshield/cli
              </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">VS Code Extension</span>
                <Badge variant="outline" className="text-[10px] font-mono">VSIX</Badge>
              </div>
              <p className="text-xs text-muted-foreground">In-editor diagnostic squiggles, automatic masking, and quick fix actions.</p>
              <div className="bg-background/80 p-2 rounded border border-border/40 font-mono text-xs text-primary">
                code --install-extension secretshield
              </div>
            </div>
          </div>
        </div>

        {/* Migration Guide: v0.x to v1.0.0 */}
        <div className="bg-card/50 border border-border/70 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30 bg-yellow-500/5">
              MIGRATION GUIDE
            </Badge>
            <h2 className="text-2xl font-bold text-foreground">Upgrading from v0.x to v1.0.0</h2>
            <p className="text-sm text-muted-foreground">
              v1.0.0 standardizes baseline configuration files and CLI flag arguments.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                1. Baseline File Schema Standardization
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In v1.0.0, the baseline filename is formally standardized to <code className="text-primary font-mono">.secretshield-baseline.json</code> at your repository root. Legacy ignore lists should be migrated using the CLI command:
              </p>
              <div className="bg-background/80 p-3 rounded-xl border border-border/50 font-mono text-xs text-foreground">
                secretshield baseline --generate --output .secretshield-baseline.json
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                2. GitHub Actions CI Configuration
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Update your GitHub workflow to leverage native SARIF upload with failure thresholds:
              </p>
              <div className="bg-background/80 p-3 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground space-y-1">
                <p className="text-emerald-400">- name: SecretShield Scan</p>
                <p className="pl-2">uses: secretshield/action@v1</p>
                <p className="pl-2">with:</p>
                <p className="pl-4">fail-on: &apos;HIGH&apos;</p>
                <p className="pl-4">sarif-file: &apos;secretshield-results.sarif&apos;</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                3. Masked Fingerprints in API Responses
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw secret strings are no longer returned in any API responses or stored in SQLite database rows. All findings represent deterministic SHA-256 fingerprints and masked strings.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="bg-card/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Post-Upgrade Verification Checklist</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Verify CLI version output: <code className="text-foreground font-mono">secretshield --version</code> returns <code className="text-primary font-mono">1.0.0</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Ensure pre-commit hook runs on staged git changes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Check that SARIF reports populate in GitHub Security code scanning alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
