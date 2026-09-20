'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Send, AlertTriangle, CheckCircle2,
  ArrowLeft, Shield, HelpCircle, LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'TECHNICAL_ISSUE',
    priority: 'NORMAL',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields (Email, Subject, Message).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        setTicketId(data.data?.ticketId || 'TICKET-' + Date.now().toString(36).toUpperCase());
      } else {
        setError(data.error?.message || 'Failed to submit support ticket. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <Link href="/support">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Support Center
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Contact Support
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Submit a technical question, bug escalation, or feature inquiry to our engineering team.
          </p>
        </div>

        {/* Security Alert */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground">Confidentiality Reminder:</strong> Do not include real unredacted API keys, database credentials, or private SSH keys in your message.
          </p>
        </div>

        {/* Form or Success State */}
        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Support Request Received</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your support ticket <span className="font-mono text-primary font-bold">{ticketId}</span> has been logged. Our team will review your inquiry and respond to <span className="text-foreground font-semibold">{formData.email}</span> shortly.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link href="/support">
                <Button variant="outline" size="sm">
                  Return to Support
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Your Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="TECHNICAL_ISSUE">Technical Issue / Bug</option>
                  <option value="INTEGRATION">CI/CD & GitHub App Integration</option>
                  <option value="DETECTION">Detection Rule Question</option>
                  <option value="BILLING_ENTERPRISE">Enterprise / Self-Hosted</option>
                  <option value="OTHER">Other Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="LOW">Low (General inquiry)</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent (Production blocked)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your question or issue"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Detailed Description *</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe what you were doing, expected behavior, and error messages (remember to redact secrets)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                'Submitting Ticket...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Support Ticket
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
