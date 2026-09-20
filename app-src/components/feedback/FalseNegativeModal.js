'use client';

import React, { useState } from 'react';
import { ShieldAlert, X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FalseNegativeModal({ isOpen, onClose }) {
  const [ruleSuggestion, setRuleSuggestion] = useState('');
  const [fileType, setFileType] = useState('.env');
  const [language, setLanguage] = useState('JavaScript');
  const [description, setDescription] = useState('');
  const [syntheticExample, setSyntheticExample] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !syntheticExample.trim()) {
      setErrorMsg('Please provide a description and a synthetic (fake) example pattern.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Scanner false negative',
          title: `Missed Secret Report: ${ruleSuggestion || 'New pattern'} in ${fileType}`,
          description: description.trim(),
          syntheticExample: syntheticExample.trim(),
          language,
          fileType,
          ruleId: ruleSuggestion.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        setSyntheticExample('');
        setRuleSuggestion('');
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
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Report Missed Secret</h3>
              <p className="text-xs text-muted-foreground">Suggest a new credential format or undetected pattern</p>
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
            <h4 className="font-medium text-foreground">Pattern Report Submitted</h4>
            <p className="text-xs text-muted-foreground">Our security research team will construct regexes and entropy tests.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Critical Security Warning */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">DO NOT PASTE THE ACTUAL CREDENTIAL</p>
                <p className="text-amber-400/80 mt-0.5">
                  Always sanitize tokens with synthetic dummy values (e.g. <code className="bg-black/30 px-1 py-0.5 rounded font-mono">api_key_EXAMPLE_00000000000</code>).
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{errorMsg}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Language</label>
                <input
                  type="text"
                  placeholder="e.g. Python, YAML, Go"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">File Type / Extension</label>
                <input
                  type="text"
                  placeholder="e.g. .env, .config.json"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Provider / Rule Suggestion</label>
              <input
                type="text"
                placeholder="e.g. Datadog API Key, Supabase Service Role Key"
                value={ruleSuggestion}
                onChange={(e) => setRuleSuggestion(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description of the Pattern</label>
              <textarea
                placeholder="Explain the structure, prefix, or context where this secret appears..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                required
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Synthetic (Fake) Example Pattern
              </label>
              <textarea
                placeholder="example: DD_API_KEY=dd_api_00000000000000000000000000000000"
                value={syntheticExample}
                onChange={(e) => setSyntheticExample(e.target.value)}
                rows={2}
                required
                className="w-full rounded-md border border-input bg-background p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting…' : 'Submit Missed Secret Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
