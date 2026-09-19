'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, ListOrdered, GitBranch, FolderGit2, TrendingUp,
  Eye, Wrench, Terminal, Plug, Activity, FileText, Download
} from 'lucide-react';

export default function SecurityNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/security', label: 'Overview', icon: Shield },
    { href: '/security/queue', label: 'Security Queue', icon: ListOrdered },
    { href: '/security/repositories', label: 'Repositories', icon: GitBranch },
    { href: '/security/projects', label: 'Projects', icon: FolderGit2 },
    { href: '/security/trends', label: 'Trends', icon: TrendingUp },
    { href: '/security/exposure', label: 'Exposure', icon: Eye },
    { href: '/security/remediation', label: 'Remediation', icon: Wrench },
    { href: '/security/ci', label: 'CI Protection', icon: Terminal },
    { href: '/security/integrations', label: 'Integrations', icon: Plug },
    { href: '/security/digest', label: 'Digest', icon: Activity },
    { href: '/security/report', label: 'Executive Report', icon: FileText }
  ];

  return (
    <div className="border-b border-slate-800/80 mb-8 overflow-x-auto">
      <div className="flex items-center gap-1 pb-px min-w-max">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
