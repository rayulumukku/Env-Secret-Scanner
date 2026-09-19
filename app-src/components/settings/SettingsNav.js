'use client';

/**
 * components/settings/SettingsNav.js
 *
 * Tabbed navigation for platform settings.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User, Lock, Bell, Sliders, BarChart3, Users,
  Activity, Shield, Gauge, Key
} from 'lucide-react';

const SETTINGS_TABS = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security & Auth', icon: Lock },
  { href: '/settings/security/sessions', label: 'Sessions', icon: Key },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/preferences', label: 'Preferences', icon: Sliders },
  { href: '/settings/usage', label: 'Usage & Quotas', icon: BarChart3 },
  { href: '/settings/members', label: 'Team Members', icon: Users },
  { href: '/settings/audit-log', label: 'Audit Log', icon: Activity },
  { href: '/settings/performance', label: 'Performance', icon: Gauge },
  { href: '/settings/system-health', label: 'System Health', icon: Shield },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-border/50 pb-4 mb-8" aria-label="Settings navigation">
      {SETTINGS_TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
