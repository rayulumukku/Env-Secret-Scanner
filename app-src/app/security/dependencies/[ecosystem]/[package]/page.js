'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package, ShieldAlert, ArrowLeft, CheckCircle2,
  AlertTriangle, FileCode, ArrowUpRight, Wrench, Shield
} from 'lucide-react';

export default function PackageDetailPage() {
  const params = useParams();
  const ecosystem = params?.ecosystem;
  const pkgName = params?.package ? decodeURIComponent(params.package) : '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ecosystem && pkgName) {
      fetchPackageData();
    }
  }, [ecosystem, pkgName]);

  async function fetchPackageData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dependencies/packages/${ecosystem}/${encodeURIComponent(pkgName)}`);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Back Link */}
        <Link
          href="/security/dependencies"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dependency Dashboard
        </Link>

        {/* Package Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Package className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{pkgName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs uppercase text-slate-400 font-semibold">{ecosystem}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      License: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-200">{data?.license?.license || 'UNKNOWN'}</code>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {data?.heuristics?.isTyposquatCandidate ? (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-full flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Suspicious Name Signal
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validated Package Identity
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading package intelligence...</div>
        ) : (
          <div className="space-y-6">

            {/* Heuristics Notice */}
            {data?.heuristics?.isTyposquatCandidate && (
              <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-200 space-y-1">
                <div className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Typosquatting Similarity Warning (Heuristic Signal)
                </div>
                <p className="text-amber-300/80">
                  {data.heuristics.reason}. Reference genuine package: <code className="bg-slate-950 px-1 py-0.5 rounded">{data.heuristics.referencePackage}</code>.
                </p>
              </div>
            )}

            {/* Known Advisories */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Security Advisories ({data?.advisories?.length || 0})
              </h2>

              {!data?.advisories || data.advisories.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No security advisories registered for this package in SecretShield database.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.advisories.map((adv, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-400 uppercase">{adv.severity}</span>
                          <span className="font-semibold text-slate-200">{adv.id}</span>
                          {adv.cveId && <span className="text-slate-500">({adv.cveId})</span>}
                        </div>
                        {adv.references?.[0] && (
                          <a
                            href={adv.references[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                          >
                            Source Advisory <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-300 mt-2">{adv.summary}</p>
                      <div className="mt-3 text-slate-400 pt-2 border-t border-slate-850 flex items-center justify-between">
                        <div>Affected: <code className="text-amber-300">{adv.affectedRange}</code></div>
                        <div>Fixed: <code className="text-emerald-300">{adv.fixedVersions?.join(', ') || 'None published'}</code></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* License Details */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                <FileCode className="w-4 h-4 text-sky-400" /> License Governance
              </h2>
              <div className="text-xs text-slate-300 space-y-2">
                <div>SPDX Identifier: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-white font-mono">{data?.license?.license || 'UNKNOWN'}</code></div>
                <div>Classification: <span className="text-slate-400 font-medium">{data?.license?.classification || 'MISSING'}</span></div>
                <p className="text-slate-400 text-[11px] mt-1">{data?.license?.description}</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
