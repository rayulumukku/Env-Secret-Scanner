'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import Link from 'next/link';

export function OrgSwitcher() {
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setOrganizations(res.data.organizations || []);
          setActiveOrg(res.data.activeOrganization || null);
        }
      })
      .catch(() => {});
  }, []);

  if (!activeOrg && organizations.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-secondary/40 hover:bg-secondary/70 text-xs font-semibold text-foreground transition-all"
      >
        <Building2 className="w-3.5 h-3.5 text-primary" />
        <span className="max-w-[130px] truncate">{activeOrg?.name || 'Personal Workspace'}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Organizations
            </div>
            <div className="space-y-0.5">
              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => {
                    setActiveOrg(org);
                    setOpen(false);
                    // Refresh or set header
                    localStorage.setItem('secretshield_active_org', org.id);
                    window.location.reload();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    activeOrg?.id === org.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {activeOrg?.id === org.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>

            <div className="border-t border-border/40 mt-1 pt-1">
              <Link
                href="/organizations/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Organization</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
