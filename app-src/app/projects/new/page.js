'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderGit2, ArrowLeft, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severityThreshold, setSeverityThreshold] = useState('LOW');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/organizations/active/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, severityThreshold }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create project');
      }

      router.push(`/projects/${data.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-grid">
      <div className="w-full max-w-lg">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to projects
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create New Project</h1>
              <p className="text-xs text-muted-foreground">Group repositories and configure secret scanning policies</p>
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
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Core Banking API"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-sm text-foreground outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Backend microservices handling payments, ledger transactions, and user identity."
                className="w-full px-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-xs text-foreground outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                CI / Pre-commit Fail Severity Threshold
              </label>
              <select
                value={severityThreshold}
                onChange={e => setSeverityThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-xs text-foreground outline-none transition-all"
              >
                <option value="LOW">LOW — Fail build on any detected credential</option>
                <option value="MEDIUM">MEDIUM — Fail on medium, high, or critical credentials</option>
                <option value="HIGH">HIGH — Fail on high and critical credentials (Recommended)</option>
                <option value="CRITICAL">CRITICAL — Fail only on verified critical secrets</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all"
            >
              {loading ? 'Creating Project…' : 'Create Project'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
