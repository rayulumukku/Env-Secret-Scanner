'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cloud, Key, Plus, Trash2, RefreshCw, Shield, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CloudAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [provider, setProvider] = useState('aws');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [credentialToken, setCredentialToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await fetch('/api/cloud/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data.accounts || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/cloud/accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accountId,
          name: accountName,
          credentials: credentialToken || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowConnectModal(false);
        setAccountId('');
        setAccountName('');
        setCredentialToken('');
        await fetchAccounts();
      } else {
        setErrorMsg(json.error?.message || 'Failed to connect cloud account.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(id) {
    if (!confirm('Are you sure you want to disconnect this cloud account? All associated resource metadata will be removed.')) return;
    try {
      await fetch(`/api/cloud/accounts/${id}`, { method: 'DELETE' });
      await fetchAccounts();
    } catch {}
  }

  const requiredPermissionsByProvider = {
    aws: [
      'sts:GetCallerIdentity (Identity verification)',
      's3:GetBucketPublicAccessBlock (S3 bucket posture)',
      's3:GetBucketAcl (S3 ACL inspection)',
      'iam:ListRoles, iam:GetRolePolicy (IAM wildcard inspection)',
      'ec2:DescribeSecurityGroups (Port exposure inspection)',
      'ec2:DescribeVolumes (Volume encryption inspection)',
    ],
    gcp: [
      'resourcemanager.projects.get (Project status)',
      'storage.buckets.get (Cloud storage uniform bucket access)',
      'iam.roles.get (IAM role inspection)',
      'compute.firewalls.list (VPC ingress port checks)',
      'compute.disks.list (Persistent disk encryption)',
    ],
    azure: [
      'Microsoft.Resources/subscriptions/read (Subscription status)',
      'Microsoft.Storage/storageAccounts/read (Blob storage public access)',
      'Microsoft.Authorization/roleDefinitions/read (RBAC wildcard inspection)',
      'Microsoft.Network/networkSecurityGroups/read (NSG port checks)',
      'Microsoft.Compute/disks/read (Disk encryption checks)',
    ],
    generic: [
      'metadata:read (Resource inventory)',
      'configuration:inspect (Posture inspection)',
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/cloud" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Connected Cloud Accounts</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage authenticated read-only cloud connections for automated posture and resource synchronization.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConnectModal(true)}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-sm"
            id="connect-account-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect Account
          </button>
        </div>

        {/* Accounts List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Registered Cloud Providers</span>
            <span className="text-xs text-slate-500">{accounts.length} active connection(s)</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                Loading connected accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No cloud accounts connected yet. Click &quot;Connect Account&quot; to establish a read-only integration.
              </div>
            ) : (
              accounts.map(acc => (
                <div key={acc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{acc.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.provider}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {acc.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Account ID: <span className="text-slate-200">{acc.accountId}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Granted Scopes: {acc.permissions?.length || 0} read-only permissions &bull; Last Synced: {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleString() : 'Never'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDisconnect(acc.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">Connect Cloud Account</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Establish a read-only metadata synchronization connection. SecretShield never modifies cloud infrastructure.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cloud Provider</label>
                  <select
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="generic">Generic Cloud / Kubernetes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account / Project ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456789012 or my-gcp-project"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Production AWS Account"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Connection Secret / Role Token (Optional)</label>
                  <input
                    type="password"
                    placeholder="Encrypted at rest using AES-256-GCM. Never stored in plaintext."
                    value={credentialToken}
                    onChange={e => setCredentialToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                {/* Explicit Required Permissions Notice */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Required Read-Only Scopes Before Connection:
                  </div>
                  <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc list-inside">
                    {requiredPermissionsByProvider[provider]?.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center gap-2"
                  >
                    {submitting ? 'Connecting...' : 'Authorize & Connect'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
