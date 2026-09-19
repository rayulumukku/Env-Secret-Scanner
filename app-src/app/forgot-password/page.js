'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your work email address to receive reset instructions
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-foreground mb-2">Check your inbox</h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>, we have sent a secure password reset link.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <ArrowLeft className="w-4 h-4" />
                  Return to login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all"
              >
                {loading ? 'Sending link…' : 'Send Reset Link'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
