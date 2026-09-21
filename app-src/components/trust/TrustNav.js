'use client';

/**
 * components/trust/TrustNav.js
 *
 * Unified sub-navigation header for the Enterprise Trust & Compliance Center.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Lock,
  FileCheck,
  HelpCircle,
  Users,
  Layers,
  Cpu,
  Database,
  AlertTriangle,
  FileText,
  Settings,
  BookOpen,
  Boxes,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/trust', label: 'Overview', icon: Shield, exact: true },
  { href: '/trust/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trust/controls', label: 'Controls', icon: Lock },
  { href: '/trust/evidence', label: 'Evidence', icon: FileCheck },
  { href: '/trust/questionnaire', label: 'Questionnaire', icon: HelpCircle },
  { href: '/trust/policies', label: 'Policies', icon: BookOpen },
  { href: '/trust/access-reviews', label: 'Access Reviews', icon: Users },
  { href: '/trust/vendors', label: 'Vendors', icon: Boxes },
  { href: '/trust/data-flow', label: 'Data Flow', icon: Layers },
  { href: '/trust/ai', label: 'AI Privacy', icon: Cpu },
  { href: '/trust/retention', label: 'Retention', icon: Database },
  { href: '/trust/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/trust/reports', label: 'Reports', icon: FileText },
  { href: '/trust/settings', label: 'Settings', icon: Settings },
];

export default function TrustNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border/40 scrollbar-none">
      {NAV_ITEMS.map(item => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
