'use client';

/**
 * app/settings/profile/page.js
 *
 * User Profile Settings.
 */

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Check, Save, Sparkles } from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const [name, setName] = useState('Security Engineer');
  const [email, setEmail] = useState('engineer@company.local');
  const [avatarColor, setAvatarColor] = useState('emerald');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.user) {
          setName(res.data.user.name || '');
          setEmail(res.data.user.email || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save or persist
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile details have been saved successfully.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2.5 mb-2">
        <User className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Manage your personal account details and display identity.
      </p>

      <SettingsNav />

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-2xl">
              {name ? name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">{name || 'User Profile'}</h3>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="e.g. Jane Doe"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border/70 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="e.g. dev@company.com"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Used for scan alerts, finding notifications, and password resets.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
