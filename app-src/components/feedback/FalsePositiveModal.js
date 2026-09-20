'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function FalsePositiveModal({ isOpen, onClose, finding }) {
  const [issueType, setIssueType] = useState('False positive');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !finding) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Scanner false positive',
          title: `Detection Issue: ${issueType} on rule ${finding.type || finding.ruleId || 'unknown'}`,
          description: notes.trim() || `User reported ${issueType} on finding ${finding.id}`,
          ruleId: finding.type || finding.ruleId,
          findingId: finding.id,
          project: finding.file || finding.repository,
          route: '/findings',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNotes('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Report Detection Issue</h3>
              <p className="text-xs text-muted-foreground">Submit feedback on scanner accuracy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-50" />
            <h4 className="font-medium text-foreground">Report Submitted</h4>
            <p className="text-xs text-muted-foreground">Thank you for helping tune SecretShield rule catalogs.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{errorMsg}</p>
            )}

            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rule:</span>
                <span className="font-mono text-foreground font-medium">{finding.type || finding.ruleId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-mono text-foreground truncate max-w-[200px]">{finding.file}:{finding.line || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Masked:</span>
                <span className="font-mono text-primary">{finding.maskedValue || '••••••••'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="False positive">False positive (Not a real credential)</option>
                <option value="Incorrect severity">Incorrect severity assigned</option>
                <option value="Incorrect rule">Matched incorrect rule</option>
                <option value="Missing context">Missing context / Test fixture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Explanation (Optional)
              </label>
              <textarea
                placeholder="Explain why this finding is inaccurate... (Never include actual secrets)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
