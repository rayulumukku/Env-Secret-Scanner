'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create organization');
      }

      localStorage.setItem('secretshield_active_org', data.data.id);
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
        <Link href="/organizations" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to organizations
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create Organization</h1>
              <p className="text-xs text-muted-foreground">Provision a new isolated workspace environment</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Organization / Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="CyberSec Operations LLC"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all"
            >
              {loading ? 'Provisioning…' : 'Create Organization'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
