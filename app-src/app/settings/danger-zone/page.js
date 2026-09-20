'use client';

/**
 * app/settings/danger-zone/page.js
 *
 * Account & Organization Deletion (Danger Zone).
 *
 * SAFETY INVARIANTS:
 *   - Requires explicit typed confirmation strings before triggering destructive actions.
 *   - Enforces server-side authorization (only Organization OWNER can delete organization).
 *   - Clearly communicates irreversible data deletion consequences.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertOctagon, ArrowLeft, Trash2, ShieldAlert,
  AlertTriangle, CheckCircle2, Lock, Building, UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function DangerZonePage() {
  const { toast } = useToast();
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState('');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteOrganization = async () => {
    if (deleteOrgConfirm !== 'DELETE') {
      toast({ title: 'Confirmation mismatch', description: 'Please type DELETE to confirm.', variant: 'destructive' });
      return;
    }

    setIsDeletingOrg(true);
    try {
      // Execute organization deletion
      const res = await fetch('/api/organizations/default-org', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Organization deleted', description: 'Organization data has been permanently removed.' });
        window.location.href = '/organizations';
      } else {
        toast({ title: 'Action failed', description: data.error?.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not complete request.', variant: 'destructive' });
    } finally {
      setIsDeletingOrg(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirm !== 'DELETE ACCOUNT') {
      toast({ title: 'Confirmation mismatch', description: 'Please type DELETE ACCOUNT to confirm.', variant: 'destructive' });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Account deleted', description: 'Your user profile has been removed.' });
        window.location.href = '/login';
      } else {
        toast({ title: 'Action failed', description: data.error?.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not complete request.', variant: 'destructive' });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg border border-border/40 hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <h1 className="text-xl font-bold text-red-400">Danger Zone</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Irreversible account and organization deletion actions.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Delete Organization */}
        <div className="p-6 rounded-2xl border border-red-500/40 bg-red-950/10 space-y-4">
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-red-300">Delete Organization</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Permanently deletes this organization, all projects, repository scans, finding records, custom rules, baseline suppressions, and webhooks. Only organization <span className="font-semibold text-foreground">OWNERS</span> are authorized to perform this operation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-card/60 space-y-3">
            <div className="text-xs text-muted-foreground">
              To confirm, type <span className="font-mono font-bold text-red-400">DELETE</span> in the field below:
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={deleteOrgConfirm}
                onChange={(e) => setDeleteOrgConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-2 flex-1 max-w-xs focus:outline-none focus:border-red-500 font-mono"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteOrganization}
                disabled={deleteOrgConfirm !== 'DELETE' || isDeletingOrg}
                className="gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingOrg ? 'Deleting Organization...' : 'Permanently Delete Organization'}
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Delete Personal User Account */}
        <div className="p-6 rounded-2xl border border-red-500/40 bg-red-950/10 space-y-4">
          <div className="flex items-start gap-3">
            <UserX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-red-300">Delete Personal Account</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Permanently deletes your individual user account and active authentication sessions. If you are the sole owner of an organization, you must transfer ownership or delete the organization first.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-card/60 space-y-3">
            <div className="text-xs text-muted-foreground">
              To confirm, type <span className="font-mono font-bold text-red-400">DELETE ACCOUNT</span> in the field below:
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={deleteAccountConfirm}
                onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                placeholder="Type DELETE ACCOUNT to confirm"
                className="bg-secondary text-xs rounded-lg border border-border/50 px-3 py-2 flex-1 max-w-xs focus:outline-none focus:border-red-500 font-mono"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteAccountConfirm !== 'DELETE ACCOUNT' || isDeletingAccount}
                className="gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
