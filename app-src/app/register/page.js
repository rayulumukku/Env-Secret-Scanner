'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Building2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, orgName, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      router.push('/onboarding');
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Start securing your repositories and developer workflows
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ray Mukku"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Organization / Workspace Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Security Engineering"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
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
              className="w-full py-2.5 mt-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all"
            >
              {loading ? 'Creating Organization…' : 'Create Organization Account'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
