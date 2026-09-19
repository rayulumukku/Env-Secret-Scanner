'use client';

import Link from 'next/link';
import {
  Code, ArrowLeft, Shield, CheckCircle2, Lock,
  Terminal, Sparkles, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BuildingIntegrationDocPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                DEVELOPER SDK
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Code className="w-8 h-8 text-cyan-400" />
              Building a SecretShield Integration
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Learn how to implement a custom integration adapter using SecretShield's unified, zero-cloud integration interface.
            </p>
          </div>
        </div>

        {/* Security Rule Warning */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Security & Zero-Exposure Invariant
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integrations are strictly decoupled from core scanner detection logic and never receive raw secret credentials. All findings passed to integrations contain deterministic fingerprints and masked values. Credentials must be encrypted at rest using SecretShield's cryptographic envelope (<code className="text-cyan-300">lib/security/secrets.js</code>).
          </p>
        </div>

        {/* Code Example Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-100">
            1. The Integration Adapter Contract
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every integration implements the unified adapter interface:
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed">
            <pre>{`// lib/integrations/adapters/my-service.js
export const myServiceAdapter = {
  id: 'my-service',
  name: 'My Service',
  category: 'Communication',

  async connect(credentials, context) {
    // 1. Encrypt sensitive keys at rest
    // 2. Perform test handshake
    return {
      status: 'CONNECTED',
      accountId: credentials.accountId,
      connectedAt: new Date().toISOString()
    };
  },

  async disconnect(context) {
    return true;
  },

  async healthCheck(connection) {
    return {
      healthy: true,
      status: 'HEALTHY',
      lastChecked: new Date().toISOString()
    };
  },

  async handleEvent(eventPayload, context) {
    // Normalize and process payload
    return { status: 'PROCESSED' };
  }
};`}</pre>
          </div>
        </div>

        {/* Permissions & Idempotency */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-100">
            2. Event Idempotency
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All external webhooks must pass through <code className="text-cyan-300">eventDeduplicator.isDuplicate(provider, eventId, rawPayload)</code> to prevent replayed events from causing redundant scans or spamming team channels.
          </p>
        </div>

      </div>
    </div>
  );
}
