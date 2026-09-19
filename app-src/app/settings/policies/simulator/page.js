'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play, ArrowLeft, Shield, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Layers, Sparkles, Terminal, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PolicySimulatorPage() {
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [findingSeverity, setFindingSeverity] = useState('CRITICAL');
  const [findingConfidence, setFindingConfidence] = useState(95);
  const [findingRuleId, setFindingRuleId] = useState('AWS_SECRET_ACCESS_KEY');
  const [findingFile, setFindingFile] = useState('src/config/aws.env');
  const [findingBranch, setFindingBranch] = useState('main');
  const [findingStatus, setFindingStatus] = useState('OPEN');
  const [scanType, setScanType] = useState('PR');
  const [repoVisibility, setRepoVisibility] = useState('PRIVATE');
  const [historyScanStatus, setHistoryScanStatus] = useState('SCANNED');
  const [ciStatus, setCiStatus] = useState('PROTECTED');
  const [lastScanAgeHours, setLastScanAgeHours] = useState(4);

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    setLoadingPolicies(true);
    try {
      const res = await fetch('/api/policies');
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data);
      }
    } catch {}
    finally {
      setLoadingPolicies(false);
    }
  }

  async function handleSimulate(e) {
    e.preventDefault();
    setEvaluating(true);
    try {
      const res = await fetch('/api/policies/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId: selectedPolicyId || null,
          finding: {
            severity: findingSeverity,
            confidence: Number(findingConfidence),
            ruleId: findingRuleId,
            file: findingFile,
            branch: findingBranch,
            status: findingStatus,
            maskedValue: 'AKIA••••••••EXAMPLE'
          },
          repository: {
            name: 'demo-repository',
            isPrivate: repoVisibility === 'PRIVATE',
            defaultBranch: 'main',
            hasHistoryScanned: historyScanStatus === 'SCANNED',
            ciEnabled: ciStatus === 'PROTECTED',
            lastScanned: new Date(Date.now() - lastScanAgeHours * 3600000).toISOString()
          },
          scan: {
            type: scanType,
            branch: findingBranch
          },
          pr: {
            number: 101,
            branch: findingBranch
          }
        })
      });

      const json = await res.json();
      if (json.success) {
        setSimulationResult(json.data);
      }
    } catch {}
    finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Back Link */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/settings/policies"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Policies
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                  SIMULATION ENVIRONMENT
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Play className="w-8 h-8 text-indigo-400" />
                Security Policy Simulator
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Dry-run policy evaluation against synthetic or simulated repository payloads without failing CI or blocking pull requests.
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200 leading-relaxed">
            <strong className="text-white">Safety Guarantee:</strong> Policy evaluations executed in this simulator produce trace diagnostics and matching breakdowns only. No real CI check statuses, webhooks, or PR gates are modified.
          </div>
        </div>

        {/* Simulation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Form Column */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSimulate} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Payload Inputs
              </h2>

              {/* Policy Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Policy to Evaluate
                </label>
                <select
                  value={selectedPolicyId}
                  onChange={e => setSelectedPolicyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Evaluate All Active Organization Policies</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.scope})
                    </option>
                  ))}
                </select>
              </div>

              {/* Finding Attributes */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Simulated Finding</span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Severity</label>
                    <select
                      value={findingSeverity}
                      onChange={e => setFindingSeverity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Confidence (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={findingConfidence}
                      onChange={e => setFindingConfidence(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rule ID</label>
                  <input
                    type="text"
                    value={findingRuleId}
                    onChange={e => setFindingRuleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">File Path</label>
                  <input
                    type="text"
                    value={findingFile}
                    onChange={e => setFindingFile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Branch</label>
                    <input
                      type="text"
                      value={findingBranch}
                      onChange={e => setFindingBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Scan Type</label>
                    <select
                      value={scanType}
                      onChange={e => setScanType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="PR">Pull Request (PR)</option>
                      <option value="CI">CI Pipeline</option>
                      <option value="STANDARD">Scheduled Scan</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={evaluating}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-2 py-2.5 shadow-lg shadow-indigo-950"
              >
                <Play className="w-3.5 h-3.5" />
                {evaluating ? 'Simulating Evaluation...' : 'Run Policy Simulation'}
              </Button>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6 min-h-[520px]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Simulation Results
                </h2>
                {simulationResult && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    simulationResult.result === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    simulationResult.result === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {simulationResult.result}
                  </span>
                )}
              </div>

              {!simulationResult ? (
                <div className="h-80 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                  <Play className="w-10 h-10 text-slate-700" />
                  <p className="text-xs max-w-sm">
                    Configure the simulated finding and repository attributes on the left, then click <strong>Run Policy Simulation</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    simulationResult.result === 'PASSED'
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : simulationResult.result === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300'
                      : 'bg-rose-950/30 border-rose-800 text-rose-300'
                  }`}>
                    <strong className="block mb-1 font-semibold text-sm">
                      {simulationResult.summary}
                    </strong>
                    {simulationResult.simulationBanner}
                  </div>

                  {/* Evaluated Policies Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Evaluated Policy Traces ({simulationResult.evaluatedPolicies?.length || 0})
                    </h3>

                    {simulationResult.evaluatedPolicies?.map((ep, idx) => (
                      <div
                        key={idx}
                        className={`bg-slate-950 border rounded-xl p-4 space-y-3 ${
                          ep.matched ? 'border-rose-900/60' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-100">{ep.policyName}</span>
                            <span className="text-[10px] font-mono text-slate-500 ml-2">v{ep.policyVersion}</span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            ep.matched ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {ep.matched ? 'TRIGGERED / MATCHED' : 'CONDITIONS NOT MET'}
                          </span>
                        </div>

                        {/* Condition Traces */}
                        <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-900/30">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-950 text-slate-500">
                                <th className="p-2.5">Field</th>
                                <th className="p-2.5">Expected Condition</th>
                                <th className="p-2.5">Observed Value</th>
                                <th className="p-2.5 text-right">Result</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 font-mono">
                              {ep.conditionEvaluations?.map((ce, cIdx) => (
                                <tr key={cIdx}>
                                  <td className="p-2.5 text-slate-300">{ce.field}</td>
                                  <td className="p-2.5 text-cyan-400">{ce.operator} {JSON.stringify(ce.expected)}</td>
                                  <td className="p-2.5 text-slate-400">{String(ce.observed)}</td>
                                  <td className="p-2.5 text-right">
                                    {ce.matched ? (
                                      <span className="text-emerald-400 font-bold">MATCH</span>
                                    ) : (
                                      <span className="text-slate-500">NO MATCH</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Triggered Actions */}
                        {ep.matched && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-slate-400">Actions that would trigger:</span>
                            {ep.actions?.map(act => (
                              <span key={act} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                                {act}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
