'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function FeedbackModal({ isOpen, onClose }) {
  const pathname = usePathname();
  const [category, setCategory] = useState('General feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide a title and description.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          route: pathname,
          appVersion: '1.0.0',
          scannerVersion: '1.0.0',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setStatus('success');
      setTimeout(() => {
        setStatus(null);
        setTitle('');
        setDescription('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Give Product Feedback</h3>
              <p className="text-xs text-muted-foreground">Help improve SecretShield for all developers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-50" />
            <h4 className="font-medium text-foreground">Thank you for your feedback!</h4>
            <p className="text-xs text-muted-foreground">Our team reviews all product suggestions and reports.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Feedback Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="General feedback">General Feedback</option>
                <option value="Feature request">Feature Request</option>
                <option value="Bug">Bug Report</option>
                <option value="Documentation issue">Documentation Issue</option>
                <option value="Integration issue">Integration Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Summary</label>
              <input
                type="text"
                placeholder="Brief summary of your feedback..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Details</label>
              <textarea
                placeholder="What happened or what would you like to see improved? (Never include real secrets or passwords)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Attached route: <code className="text-primary font-mono">{pathname}</code></span>
              <Badge variant="outline" className="text-[10px] py-0">v1.0.0</Badge>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting…' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
