'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  GitPullRequest, ArrowLeft, Shield, AlertTriangle, CheckCircle2,
  FileCode2, Clock, GitCommit, ExternalLink, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PullRequestDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const projectId = params.id;
  const prNumber = params.number;

  const [prData, setPrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('findings');

  useEffect(() => {
    fetchPRDetails();
  }, [projectId, prNumber]);

  async function fetchPRDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pull-requests/${prNumber}`);
      const data = await res.json();
      if (data.success) {
        setPrData(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const pr = prData?.pullRequest;
  const evaluation = prData?.evaluation;
  const timeline = prData?.timeline || [];
  const changedFiles = prData?.changedFiles || [];

  const introduced = evaluation?.introducedFindings || [];
  const existing = evaluation?.existingFindings || [];
  const resolved = evaluation?.resolvedFindings || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div>
          <Link
            href={`/projects/${projectId}/pull-requests`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Pull Requests
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-mono text-cyan-400 font-bold">#{prNumber}</span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{pr?.title || `Pull Request #${prNumber}`}</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                From <code className="text-slate-300">{pr?.sourceBranch || 'feature'}</code> into <code className="text-slate-300">{pr?.targetBranch || 'main'}</code> by {pr?.author || 'Developer'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPRDetails}
                disabled={loading}
                className="border-slate-800 hover:bg-slate-900"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Rescan PR
              </Button>
            </div>
          </div>
        </div>

        {/* Security Gate Banner */}
        {evaluation && (
          <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
            evaluation.isPassed
              ? 'bg-emerald-950/20 border-emerald-800/60'
              : 'bg-rose-950/20 border-rose-800/60'
          }`}>
            <div className="flex items-start gap-4">
              {evaluation.isPassed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  SecretShield Security Check
                </div>
                <div className="text-xl font-bold text-slate-100">
                  {evaluation.isPassed ? 'Passed — Safe to Merge' : 'Failed — New Secrets Introduced'}
                </div>
                <p className="text-sm text-slate-300 mt-1">{evaluation.summaryMessage}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Findings Introduced</div>
                <div className={`text-2xl font-bold ${evaluation.counts?.introduced > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {evaluation.counts?.introduced || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Files Changed</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{changedFiles.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-rose-400">New Findings (Blocking)</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{introduced.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-amber-400">Pre-Existing Base Findings</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{existing.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-emerald-400">Resolved by this PR</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{resolved.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'findings'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Findings Breakdown
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Changed Files ({changedFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Security Timeline
          </button>
        </div>

        {/* Tab 1: Findings Breakdown */}
        {activeTab === 'findings' && (
          <div className="space-y-6">
            
            {/* Newly Introduced */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-rose-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Newly Introduced Secrets ({introduced.length})
              </h3>
              {introduced.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  No new secrets were introduced in this PR.
                </div>
              ) : (
                <div className="space-y-3">
                  {introduced.map((f, i) => (
                    <div key={`intro_${i}`} className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-rose-300">{f.ruleName || f.ruleId}</span>
                        <span className="text-xs font-mono text-slate-400">{f.file}:{f.line}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded text-xs font-mono text-slate-300 mb-2">
                        {f.maskedValue}
                      </div>
                      <div className="text-xs text-slate-400">
                        Action: Must be removed before merge.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pre-Existing Findings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Pre-Existing Base Findings ({existing.length})
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                These findings existed in the base branch before this PR was created and do not block this PR from passing.
              </p>
              {existing.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-lg">
                  No pre-existing base branch findings.
                </div>
              ) : (
                <div className="space-y-3">
                  {existing.map((f, i) => (
                    <div key={`exist_${i}`} className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-200">{f.ruleName || f.ruleId}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{f.file}:{f.line}</div>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
                        Existing in Base
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Changed Files */}
        {activeTab === 'files' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-4">Changed Files in this Pull Request</h3>
            <div className="space-y-3">
              {changedFiles.map((file, i) => (
                <div key={`file_${i}`} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCode2 className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs text-slate-200">{file.filePath}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      file.changeType === 'ADDED' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                    }`}>
                      {file.changeType}
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-emerald-400">+{file.additions || 0}</span>
                    <span className="text-rose-400 ml-2">-{file.deletions || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Security Timeline */}
        {activeTab === 'timeline' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-6">PR Security Lifecycle Timeline</h3>
            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {timeline.map((evt, idx) => (
                <div key={`tl_${idx}`} className="flex items-start gap-4 relative pl-2">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{evt.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{evt.timestamp} • {evt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
