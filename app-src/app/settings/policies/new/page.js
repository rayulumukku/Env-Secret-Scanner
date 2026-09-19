'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, ArrowLeft, Plus, Trash2, CheckCircle2,
  AlertTriangle, Layers, Info, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewPolicyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('ORGANIZATION');
  const [scopeId, setScopeId] = useState('');
  const [enabled, setEnabled] = useState(true);

  const [conditions, setConditions] = useState([
    { field: 'severity', operator: 'EQUALS', value: 'CRITICAL' },
    { field: 'findingStatus', operator: 'EQUALS', value: 'OPEN' }
  ]);

  const [actions, setActions] = useState(['FAIL_PR', 'FAIL_CI', 'NOTIFY']);

  function handleAddCondition() {
    setConditions(prev => [
      ...prev,
      { field: 'severity', operator: 'EQUALS', value: 'HIGH' }
    ]);
  }

  function handleRemoveCondition(idx) {
    if (conditions.length <= 1) return;
    setConditions(prev => prev.filter((_, i) => i !== idx));
  }

  function handleConditionChange(idx, key, val) {
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));
  }

  function handleActionToggle(actionName) {
    setActions(prev =>
      prev.includes(actionName)
        ? prev.filter(a => a !== actionName)
        : [...prev, actionName]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a policy name');
      return;
    }

    if (actions.length === 0) {
      setError('Please select at least one action');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          scope,
          scopeId: scope === 'ORGANIZATION' ? null : scopeId.trim(),
          conditions,
          actions,
          enabled
        })
      });

      const json = await res.json();
      if (json.success) {
        router.push('/settings/policies');
      } else {
        setError(json.error || 'Failed to create policy');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link & Header */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/settings/policies"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Policies
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              Policy Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure deterministic compound conditions and enforceable security actions.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* General Information */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              1. General Details
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block Critical Secrets in Pull Requests"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly explain the governance rationale or compliance purpose..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enforcement Scope *
                  </label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ORGANIZATION">Organization-wide (All repositories)</option>
                    <option value="PROJECT">Project Scoped</option>
                    <option value="REPOSITORY">Specific Repository</option>
                  </select>
                </div>

                {scope !== 'ORGANIZATION' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {scope === 'PROJECT' ? 'Project ID or Slug *' : 'Repository Name / ID *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={scope === 'PROJECT' ? 'e.g. proj_cloud_infra' : 'e.g. backend-api'}
                      value={scopeId}
                      onChange={e => setScopeId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Condition Builder (AND Logic) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  2. Compound Conditions (AND Logic)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The policy will only trigger when ALL conditions match.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCondition}
                className="text-xs border-slate-800 hover:bg-slate-800 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                Add Condition
              </Button>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  <span className="text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 px-2 py-1 rounded border border-slate-800">
                    {idx === 0 ? 'IF' : 'AND'}
                  </span>

                  {/* Field Selector */}
                  <div className="w-full md:w-1/3">
                    <select
                      value={cond.field}
                      onChange={e => handleConditionChange(idx, 'field', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="severity">Finding Severity</option>
                      <option value="confidence">Confidence Score (%)</option>
                      <option value="findingStatus">Finding Status</option>
                      <option value="branch">Target / Scanned Branch</option>
                      <option value="filePattern">File Path Pattern</option>
                      <option value="ruleId">Specific Rule ID</option>
                      <option value="scanType">Scan Execution Type</option>
                      <option value="repositoryVisibility">Repository Visibility</option>
                      <option value="lastScanAgeHours">Last Scan Age (Hours)</option>
                      <option value="historyScanStatus">Git History Scan Status</option>
                      <option value="ciStatus">CI Protection Gate Status</option>
                    </select>
                  </div>

                  {/* Operator Selector */}
                  <div className="w-full md:w-1/4">
                    <select
                      value={cond.operator}
                      onChange={e => handleConditionChange(idx, 'operator', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="EQUALS">Equals (=)</option>
                      <option value="NOT_EQUALS">Does not equal (≠)</option>
                      <option value="GREATER_THAN_OR_EQUAL">Greater or Equal (≥)</option>
                      <option value="LESS_THAN_OR_EQUAL">Less or Equal (≤)</option>
                      <option value="IN">In List (comma separated)</option>
                      <option value="NOT_IN">Not in List</option>
                      <option value="MATCHES_PATTERN">Matches Glob/Pattern</option>
                    </select>
                  </div>

                  {/* Value Input */}
                  <div className="w-full md:flex-1">
                    {cond.field === 'severity' ? (
                      <select
                        value={cond.value}
                        onChange={e => handleConditionChange(idx, 'value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    ) : cond.field === 'findingStatus' ? (
                      <select
                        value={cond.value}
                        onChange={e => handleConditionChange(idx, 'value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                        <option value="REMEDIATED">REMEDIATED</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Value or pattern..."
                        value={cond.value}
                        onChange={e => handleConditionChange(idx, 'value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none font-mono"
                      />
                    )}
                  </div>

                  {/* Remove Button */}
                  {conditions.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCondition(idx)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                3. Enforcement Actions
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select one or more actions to execute upon policy match.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'FAIL_PR', label: 'Fail PR Check', desc: 'Block pull request from merging' },
                { id: 'FAIL_CI', label: 'Fail CI Build', desc: 'Exit with non-zero status code' },
                { id: 'FAIL_SCAN', label: 'Fail Scan Status', desc: 'Mark scan result as FAILED' },
                { id: 'WARN', label: 'Emit Warning', desc: 'Alert without blocking pipeline' },
                { id: 'NOTIFY', label: 'Send Notifications', desc: 'Emit Slack & webhook alerts' },
                { id: 'CREATE_TASK', label: 'Create Triage Task', desc: 'Assign remediation workflow' }
              ].map(act => {
                const selected = actions.includes(act.id);
                return (
                  <div
                    key={act.id}
                    onClick={() => handleActionToggle(act.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      selected
                        ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-100'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-200">{act.label}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        selected ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{act.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <Link href="/settings/policies">
              <Button type="button" variant="ghost" className="text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={submitting}
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 px-6 shadow-lg shadow-cyan-950"
            >
              {submitting ? 'Creating Policy...' : 'Save & Activate Policy'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
