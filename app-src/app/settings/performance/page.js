'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { runBenchmark } from '@/lib/scanner/benchmark';
import {
  Gauge, ArrowLeft, Play, Zap, HardDrive, Clock,
  Cpu, CheckCircle2, RefreshCw, BarChart3, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PerformanceSettingsPage() {
  const [fileCount, setFileCount] = useState(1000);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      // Small tick to let UI update
      await new Promise(r => setTimeout(r, 50));
      const res = await runBenchmark({ fileCount, linesPerFile: 35 });
      setBenchmarkResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Scanner Performance & Throughput</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Benchmark scanner engine throughput, execution latency, and memory footprint.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={fileCount}
              onChange={e => setFileCount(Number(e.target.value))}
              className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-1.5 focus:outline-none"
            >
              <option value={1000}>1,000 Synthetic Files</option>
              <option value={5000}>5,000 Synthetic Files</option>
              <option value={10000}>10,000 Synthetic Files</option>
            </select>
            <Button onClick={handleRunBenchmark} disabled={isRunning} size="sm" className="gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? 'Benchmarking...' : 'Run Benchmark'}
            </Button>
          </div>
        </div>

        {/* Live Benchmark Stat Cards */}
        {benchmarkResult ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  Throughput
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {benchmarkResult.filesPerSec.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">files/sec</span>
                </div>
                <p className="text-[11px] text-primary mt-1 font-mono">
                  {benchmarkResult.mbPerSec} MB/sec scanned
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Total Duration
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {benchmarkResult.durationMs}
                  <span className="text-xs font-normal text-muted-foreground ml-1">ms</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {benchmarkResult.filesCount.toLocaleString()} files ({benchmarkResult.totalSizeMb} MB)
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Heap Memory Delta
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {benchmarkResult.memoryUsageMb}
                  <span className="text-xs font-normal text-muted-foreground ml-1">MB</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Low GC pressure & stream reuse
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Synthetics Evaluated
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {benchmarkResult.findingsCount}
                  <span className="text-xs font-normal text-muted-foreground ml-1">matches</span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 50 rules executed
                </p>
              </div>
            </div>

            {/* Rule Execution Time Breakdown */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Rule Category Latency Breakdown
              </h3>
              <div className="space-y-3">
                {benchmarkResult.topRuleTimings.map((timing, idx) => {
                  const pct = Math.round((timing.timeMs / benchmarkResult.durationMs) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">{timing.rule}</span>
                        <span className="text-muted-foreground font-mono">{timing.timeMs} ms ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/40 p-12 text-center space-y-4">
            <Gauge className="w-12 h-12 mx-auto text-primary/60" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Run On-Demand Scanner Benchmark</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Evaluate throughput across JavaScript, Python, YAML, JSON, and .env files on this machine.
              </p>
            </div>
            <Button onClick={handleRunBenchmark} disabled={isRunning} className="gap-2">
              <Play className="w-4 h-4 fill-current" />
              {isRunning ? 'Running Benchmark...' : 'Start 1,000 File Benchmark'}
            </Button>
          </div>
        )}

        {/* Engine Optimization Notes */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Pre-Compiled Regular Expressions
            </span>
            <p className="leading-relaxed">All 50+ built-in rules utilize cached, pre-compiled RegEx instances with ReDoS guards.</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Streamlined Shannon Entropy
            </span>
            <p className="leading-relaxed">Optimized single-pass character frequency counts with early bail-outs on low-entropy strings.</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Fast Binary Filtering
            </span>
            <p className="leading-relaxed">Null-byte probe in initial 8KB eliminates binary files before invoking rule evaluators.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
