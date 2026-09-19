'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Menu, X, Zap, User, LogOut, Settings, FolderGit2, Search, Users, Activity, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OrgSwitcher } from './OrgSwitcher';
import { NotificationBell } from './NotificationBell';

const NAV_LINKS = [
  { href: '/dashboard',          label: 'Dashboard' },
  { href: '/projects',           label: 'Projects' },
  { href: '/findings',           label: 'Findings' },
  { href: '/scan',               label: 'Scanner' },
  { href: '/rules',              label: 'Rules' },
  { href: '/settings/members',   label: 'Team' },
  { href: '/settings/audit-log', label: 'Audit Log' },
  { href: '/docs',               label: 'Docs' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setUser(res.data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Org Switcher */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
                  <Shield className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full pulse-ring" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-base tracking-tight text-foreground">
                  Secret<span className="text-primary">Shield</span>
                </span>
                <div className="text-[10px] text-muted-foreground leading-none font-mono">v2.0 SaaS</div>
              </div>
            </Link>

            <OrgSwitcher />
          </div>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <NotificationBell />

            <Link href="/scan" className="hidden sm:block">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                <Zap className="w-3.5 h-3.5" />
                Scan Code
              </Button>
            </Link>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/70 text-foreground transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:block text-xs font-semibold max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                      <div className="px-2.5 py-2 border-b border-border/40 mb-1">
                        <div className="font-semibold text-foreground truncate">{user.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                      </div>

                      <Link
                        href="/settings/members"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        Team Members
                      </Link>

                      <Link
                        href="/settings/audit-log"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        Audit Log
                      </Link>

                      <div className="border-t border-border/40 my-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs bg-primary text-primary-foreground">Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/scan" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full mt-3 gap-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              Scan Code
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
