'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Shield, Trash2, Mail, Check,
  AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch('/api/organizations/active/members');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMembers(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/organizations/active/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to invite member');
      }

      setEmail('');
      setInviteModal(false);
      loadMembers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    await fetch('/api/organizations/active/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    loadMembers();
  }

  async function handleRemove(userId) {
    await fetch(`/api/organizations/active/members?userId=${userId}`, {
      method: 'DELETE',
    });
    loadMembers();
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Team Members
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage organization members and role-based permissions (Owner, Admin, Member, Viewer)
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setInviteModal(true)}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </Button>
        </div>

        {/* Members Roster Table */}
        <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Member Name & Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {m.user?.name ? m.user.name[0].toUpperCase() : m.invitedEmail ? m.invitedEmail[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{m.user?.name || m.invitedEmail?.split('@')[0] || 'User'}</div>
                          <div className="text-[11px] text-muted-foreground">{m.user?.email || m.invitedEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.userId, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-border/60 bg-secondary/30 text-xs font-semibold text-foreground outline-none focus:border-primary"
                      >
                        <option value="OWNER">Owner (Full access)</option>
                        <option value="ADMIN">Admin (Manage projects & rules)</option>
                        <option value="MEMBER">Member (Scan & manage findings)</option>
                        <option value="VIEWER">Viewer (Read-only)</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="p-4 text-muted-foreground font-mono">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemove(m.userId)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Invite Member Modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
              Invite Team Member
            </h3>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Role & Permissions</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="MEMBER">Member — Can scan and resolve findings</option>
                  <option value="ADMIN">Admin — Can manage projects, rules, and members</option>
                  <option value="VIEWER">Viewer — Read-only dashboard access</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setInviteModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-primary text-primary-foreground font-bold">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
