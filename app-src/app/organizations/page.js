'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Shield, Users, FolderGit2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setOrganizations(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Organizations & Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Switch between workspaces or provision new organization environments
            </p>
          </div>

          <Link href="/organizations/new">
            <Button size="sm" className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground">
              <Plus className="w-3.5 h-3.5" />
              New Organization
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {organizations.map(org => (
            <div
              key={org.id}
              className="p-5 rounded-2xl border border-border/60 bg-card/40 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary text-muted-foreground">
                    Role: {org.userRole || 'MEMBER'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{org.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">slug: {org.slug}</p>
              </div>

              <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                <span>{org.projectCount || 0} Projects • {org.memberCount || 1} Members</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem('secretshield_active_org', org.id);
                    window.location.href = '/dashboard';
                  }}
                  className="text-xs h-7"
                >
                  Switch Workspace
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
