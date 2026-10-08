'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert, ArrowLeft, ExternalLink, ArrowUpRight,
  Wrench, CheckCircle2, AlertTriangle, Layers, FileCode
} from 'lucide-react';

export default function VulnerabilityDetailPage() {
  const params = useParams();
  const advisoryId = params?.id ? decodeURIComponent(params.id) : '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (advisoryId) {
      fetchVulnerabilityDetail();
    }
  }, [advisoryId]);

  async function fetchVulnerabilityDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dependencies/vulnerabilities/${encodeURIComponent(advisoryId)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  const advisory = data?.advisory;
  const finding = data?.finding;
  const remediation = data?.remediation;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Back Link */}
        <Link
          href="/security/dependencies"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dependency Dashboard
        </Link>

        {/* Advisory Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {advisory?.severity || 'HIGH'}
                    </span>
                    <h1 className="text-xl font-bold text-white tracking-tight">{advisoryId}</h1>
                    {advisory?.cveId && <span className="text-xs text-slate-400">({advisory.cveId})</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Source: <span className="text-slate-200 font-medium">{advisory?.source || 'Authoritative Security Database'}</span>
                  </div>
                </div>
              </div>
            </div>

            {advisory?.references?.[0] && (
              <a
                href={advisory.references[0]}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-400 flex items-center gap-1.5 font-medium transition"
              >
                Upstream Advisory <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Advisory Details */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading advisory details...</div>
        ) : (
          <div className="space-y-6">

            {/* Summary & Description */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400">
                Summary & Technical Details
              </h2>
              <div className="text-sm font-medium text-white">{advisory?.summary}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{advisory?.description}</p>
            </div>

            {/* Affected Versions & Semver Window */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium mb-2">Affected Semver Range</div>
                <code className="text-sm text-amber-300 bg-slate-950 px-2 py-1 rounded block font-mono">
                  {advisory?.affectedRange || '*'}
                </code>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium mb-2">Fixed Version(s)</div>
                <code className="text-sm text-emerald-300 bg-slate-950 px-2 py-1 rounded block font-mono">
                  {advisory?.fixedVersions?.join(', ') || 'No patch published'}
                </code>
              </div>
            </div>

            {/* Remediation Steps */}
            <div className="bg-slate-900/40 border border-indigo-900/40 rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" /> Remediation Guidance
              </h2>
              <p className="text-xs text-slate-300">
                {remediation?.upgradeGuidance || 'Upgrade dependency to latest non-vulnerable version.'}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Note: SecretShield does not execute package installations automatically without human authorization.
              </div>
            </div>

            {/* References */}
            {advisory?.references && advisory.references.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white mb-3">External References</h2>
                <ul className="space-y-1.5 text-xs">
                  {advisory.references.map((ref, idx) => (
                    <li key={idx}>
                      <a
                        href={ref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono break-all"
                      >
                        {ref} <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
