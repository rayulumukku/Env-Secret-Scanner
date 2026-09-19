'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome to SecretShield</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to your developer security dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
            <span className="relative bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setError('GitHub OAuth requires client ID/secret configuration.')}
              className="w-full gap-2 text-xs border-border/60 hover:bg-secondary"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setError('GitLab OAuth requires application ID configuration.')}
              className="w-full gap-2 text-xs border-border/60 hover:bg-secondary"
            >
              <svg className="w-4 h-4 fill-orange-500" viewBox="0 0 24 24">
                <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.42-.735-.42-.885 0L16.4 9.452H7.6L4.935 1.263c-.15-.42-.75-.42-.885 0L1.386 9.452.045 13.587c-.12.375.015.795.33 1.035L12 23.955l11.625-9.333c.315-.24.45-.66.33-1.035"/>
              </svg>
              GitLab
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create an organization account
          </Link>
        </p>
      </div>
    </div>
  );
}
