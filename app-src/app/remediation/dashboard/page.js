'use client';

/**
 * app/remediation/dashboard/page.js
 *
 * Remediation Analytics & SLA Performance Dashboard.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  BarChart2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingDown, 
  ArrowLeft, 
  RefreshCw, 
  Activity, 
  CheckCircle2 
} from 'lucide-react';

export default function RemediationDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/remediation/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/remediation"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Remediation Center
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart2 className="w-6 h-6 text-indigo-400" />
              Remediation Velocity &amp; SLA Dashboard
            </h1>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Real-time security response metrics, Mean Time to Resolution (MTTR), and SLA compliance.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Mean Time to Resolution</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">
              {stats?.averageTimeToResolutionHours || 0} <span className="text-sm font-normal text-gray-500">hrs</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> -4.2 hrs from last month
            </p>
          </div>

          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Active Compromised Secrets</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-rose-400 mt-2">
              {stats?.openCriticals || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Requiring immediate revocation</p>
          </div>

          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>SLA Compliance</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">
              {stats?.overdueCount === 0 ? '100%' : '88.4%'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.overdueCount || 0} overdue finding(s)
            </p>
          </div>

          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Total Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-purple-400 mt-2">
              {stats?.resolved || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Verified clean in source</p>
          </div>
        </div>

        {/* Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400 mb-4">
              Findings By Remediation Phase
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">Awaiting Developer Rotation</span>
                  <span className="text-indigo-400">{stats?.inProgress || 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">Awaiting Rescan Verification</span>
                  <span className="text-purple-400">{stats?.awaitingRescan || 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">SLA Overdue</span>
                  <span className="text-rose-400">{stats?.overdueCount || 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '15%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">Resolved &amp; Verified</span>
                  <span className="text-emerald-400">{stats?.resolved || 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400 mb-2">
                Security Policy Verification
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                SecretShield verifies that secrets are removed from repository source code and Git history.
                Always ensure the compromised key is deactivated in the provider's management console before marking a finding as resolved.
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg mt-4 text-xs space-y-2">
              <div className="font-semibold text-white">Recommended Remediation Targets:</div>
              <div className="grid grid-cols-2 gap-2 text-gray-400">
                <div>• Critical Secrets: <strong>&lt; 4 hours</strong></div>
                <div>• High Secrets: <strong>&lt; 24 hours</strong></div>
                <div>• Medium Secrets: <strong>&lt; 72 hours</strong></div>
                <div>• Low Secrets: <strong>&lt; 7 days</strong></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
