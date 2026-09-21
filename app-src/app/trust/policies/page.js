'use client';

/**
 * app/trust/policies/page.js
 *
 * Security Policy Library & Approval Workflow.
 * Manage editable policy documents, versioning, review schedules,
 * and auditable transitions (DRAFT -> REVIEW -> APPROVAL -> ACTIVE -> RETIRED).
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  Shield,
  RefreshCw,
  Plus,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function SecurityPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/policies');
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data.policies || []);
        if (json.data.policies?.length > 0 && !selectedPolicy) {
          setSelectedPolicy(json.data.policies[0]);
          setEditContent(json.data.policies[0].content);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPolicy(p) {
    setSelectedPolicy(p);
    setEditContent(p.content);
    setEditSummary(p.changeSummary || '');
    setIsEditing(false);
    setErrorMsg(null);
  }

  async function handleSavePolicy(statusOverride = null) {
    if (!selectedPolicy) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const payload = {
        content: editContent,
        changeSummary: editSummary || 'Policy content updated',
      };
      if (statusOverride) {
        payload.status = statusOverride;
      }

      const res = await fetch(`/api/trust/policies/${selectedPolicy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSelectedPolicy(json.data.policy);
        setIsEditing(false);
        fetchPolicies();
      } else {
        setErrorMsg(json.error || 'Failed to update policy');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const getStatusBadge = status => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">ACTIVE</Badge>;
      case 'APPROVAL':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">APPROVAL</Badge>;
      case 'REVIEW':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">REVIEW</Badge>;
      case 'RETIRED':
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30 text-[10px]">RETIRED</Badge>;
      default:
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">DRAFT</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/5 text-xs">
            Organizational Governance
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Informational Technical Baselines</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-cyan-400" />
              Security Policy Library & Workflow
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Editable organizational policy documents, version histories, lifecycle approvals,
              and compliance review cadence.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchPolicies}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <TrustNav />

      {/* Disclaimers & Advice Alert */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Informational Policy Templates Notice
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Policy templates are provided for technical security governance and baseline enforcement. They reflect
            internal organizational controls and do not constitute legal advice or formal external certifications.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Two-Column Grid: Policy List & Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Policies Index */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            Organization Policies ({policies.length})
          </div>
          <div className="space-y-2">
            {policies.map(p => {
              const isSelected = selectedPolicy?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPolicy(p)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 bg-card/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">{p.title}</span>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.summary}</div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-2 pt-2 border-t border-border/40">
                    <span>v{p.version}</span>
                    <span>Owner: {p.owner}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Policy Content & Lifecycle Actions */}
        <div className="lg:col-span-8">
          {selectedPolicy ? (
            <Card className="border-border/60 bg-card/40 space-y-4">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">{selectedPolicy.title}</CardTitle>
                      {getStatusBadge(selectedPolicy.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Category: <span className="font-mono text-foreground">{selectedPolicy.category}</span> •
                      Version: <span className="font-mono">{selectedPolicy.version}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="text-xs gap-1.5"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Edit Policy
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setEditContent(selectedPolicy.content);
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSavePolicy()}
                          disabled={saving}
                          className="text-xs"
                        >
                          {saving ? 'Saving...' : 'Save Draft'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Progression Actions */}
                <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-border/30 mt-3 text-xs">
                  <span className="text-muted-foreground font-medium mr-1">Lifecycle Action:</span>
                  {selectedPolicy.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavePolicy('REVIEW')}
                      disabled={saving}
                      className="text-[11px] h-7 px-2.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    >
                      Submit for Review →
                    </Button>
                  )}
                  {selectedPolicy.status === 'REVIEW' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavePolicy('APPROVAL')}
                      disabled={saving}
                      className="text-[11px] h-7 px-2.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      Request Approval →
                    </Button>
                  )}
                  {selectedPolicy.status === 'APPROVAL' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSavePolicy('ACTIVE')}
                      disabled={saving}
                      className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve & Publish (Active)
                    </Button>
                  )}
                  {selectedPolicy.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavePolicy('RETIRED')}
                      disabled={saving}
                      className="text-[11px] h-7 px-2.5 border-slate-700 text-slate-400 hover:bg-slate-800"
                    >
                      Retire Policy
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={16}
                      className="w-full font-mono text-xs bg-background p-4 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                    />
                    <input
                      type="text"
                      placeholder="Change summary / reason for update..."
                      value={editSummary}
                      onChange={e => setEditSummary(e.target.value)}
                      className="w-full text-xs bg-background p-2.5 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 font-sans text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 border-0 text-muted-foreground leading-relaxed text-xs">
                      {selectedPolicy.content}
                    </pre>
                  </div>
                )}

                {/* Policy Metadata Footer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
                  <div>
                    <div className="font-semibold text-foreground">Effective Date</div>
                    <div className="font-mono">
                      {selectedPolicy.effectiveDate
                        ? new Date(selectedPolicy.effectiveDate).toLocaleDateString()
                        : 'Pending'}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Next Review Date</div>
                    <div className="font-mono">
                      {selectedPolicy.reviewDate
                        ? new Date(selectedPolicy.reviewDate).toLocaleDateString()
                        : 'Annual'}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Approver</div>
                    <div>{selectedPolicy.approver || 'Unapproved Draft'}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Last Modified</div>
                    <div className="font-mono">
                      {new Date(selectedPolicy.updatedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              Select a policy from the list to review and edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
