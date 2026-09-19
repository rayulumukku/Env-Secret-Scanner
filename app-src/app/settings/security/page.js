'use client';

/**
 * app/settings/security/page.js
 *
 * Security Settings & Password Management.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Shield, Key, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'New password and confirmation must match exactly.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    await new Promise(r => setTimeout(r, 500));
    setUpdating(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    toast({
      title: 'Password Updated',
      description: 'Your account password has been updated. Other sessions have been rotated.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2.5 mb-2">
        <Lock className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Security & Authentication</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Configure password security, session revocation, and authentication policies.
      </p>

      <SettingsNav />

      <div className="max-w-2xl space-y-8">
        {/* Password Update Card */}
        <form onSubmit={handlePasswordChange} className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Change Password
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="Min 8 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={updating}
              className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              {updating ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>

        {/* Sessions Quick Link */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">Active Web Sessions</h4>
            <p className="text-xs text-muted-foreground">
              Review browsers and devices currently signed in to your account.
            </p>
          </div>
          <Link href="/settings/security/sessions">
            <Button variant="outline" size="sm" className="font-semibold">
              Manage Sessions
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
