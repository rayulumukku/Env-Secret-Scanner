'use client';

/**
 * app/settings/security/sessions/page.js
 *
 * Active Sessions Manager.
 * Displays approximate browser, OS, active status, and supports revoking other sessions.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Key, Laptop, Smartphone, Globe, Shield, Trash2,
  CheckCircle2, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function SessionsManagerPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([
    {
      id: 'sess-current',
      browser: 'Chrome on Windows',
      ip: '127.0.0.1 (Localhost)',
      lastActive: 'Active Now',
      isCurrent: true,
      deviceType: 'desktop',
    },
    {
      id: 'sess-cli',
      browser: 'SecretShield CLI v0.4.0',
      ip: '127.0.0.1',
      lastActive: '2 hours ago',
      isCurrent: false,
      deviceType: 'cli',
    },
  ]);

  const [revoking, setRevoking] = useState(false);

  const handleRevokeOther = async () => {
    setRevoking(true);
    await new Promise(r => setTimeout(r, 400));
    setSessions(prev => prev.filter(s => s.isCurrent));
    setRevoking(false);
    toast({
      title: 'Sessions Revoked',
      description: 'All other active sessions have been signed out.',
    });
  };

  const handleRevokeSingle = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast({
      title: 'Session Revoked',
      description: 'The selected session was terminated.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2.5 mb-2">
        <Key className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Active Sessions</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Review and revoke active web sessions and CLI authorization tokens.
      </p>

      <SettingsNav />

      <div className="max-w-3xl space-y-6">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {sessions.length} Active Session{sessions.length > 1 ? 's' : ''}
          </span>

          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOther}
              disabled={revoking}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {revoking ? 'Revoking...' : 'Log Out Other Sessions'}
            </Button>
          )}
        </div>

        {/* Sessions List */}
        <div className="rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/40 overflow-hidden">
          {sessions.map(sess => (
            <div key={sess.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-secondary text-primary flex-shrink-0">
                  {sess.deviceType === 'desktop' ? <Laptop className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{sess.browser}</span>
                    {sess.isCurrent && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                        Current Session
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    IP: {sess.ip} · {sess.lastActive}
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSingle(sess.id)}
                  className="text-muted-foreground hover:text-red-400 text-xs"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
