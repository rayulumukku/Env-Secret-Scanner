import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  Terminal, 
  Code2, 
  FileCode, 
  ArrowLeft, 
  ShieldCheck, 
  Layers, 
  Cpu 
} from 'lucide-react';

export const metadata = {
  title: 'Editor & IDE Integration Contract | SecretShield',
  description: 'Planned API specification and contract for VS Code, JetBrains, and Neovim editor extensions.',
};

export default function EditorIntegrationDocPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documentation
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Code2 className="w-7 h-7 text-indigo-400" />
            Editor &amp; IDE Integration Specification
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Planned architecture and API specification for VS Code, JetBrains, and Neovim real-time editor plugins.
          </p>
        </div>

        <div className="space-y-8 mt-8 text-sm text-gray-300 leading-relaxed">
          {/* Architecture Overview */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Integration Architecture
            </h2>
            <p>
              Editor extensions communicate with SecretShield either via the local <code className="text-indigo-300 font-mono">@secretshield/cli</code> bridge or the stateless SecretShield Scan API endpoint to display real-time squiggly diagnostics as developers type.
            </p>
          </div>

          {/* API Specification */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Buffer Scanning Endpoint
            </h2>
            <p className="text-xs text-gray-400">
              Used by editor extensions to scan active editor buffers prior to saving.
            </p>

            <div className="p-3 bg-gray-900 border border-gray-800 rounded font-mono text-xs text-indigo-300">
              POST /api/scan
            </div>

            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider pt-2">Request Body (JSON)</h3>
            <pre className="p-3 bg-[#0d1117] border border-gray-800 rounded text-xs font-mono text-gray-300 overflow-x-auto">
{`{
  "content": "const AWS_KEY = \\"AKIAIOSFODNN7EXAMPLE\\";",
  "filename": "src/config.ts",
  "options": {
    "severityThreshold": "LOW",
    "useProjectRules": true
  }
}`}
            </pre>

            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider pt-2">Response Body (JSON)</h3>
            <pre className="p-3 bg-[#0d1117] border border-gray-800 rounded text-xs font-mono text-gray-300 overflow-x-auto">
{`{
  "scanId": "scan_1726789012_abc",
  "status": "completed",
  "durationMs": 4,
  "filesScanned": 1,
  "totalFindings": 1,
  "criticalCount": 1,
  "findings": [
    {
      "fingerprint": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "ruleId": "aws-access-token",
      "type": "AWS Access Key",
      "severity": "CRITICAL",
      "confidence": 95,
      "file": "src/config.ts",
      "line": 1,
      "column": 17,
      "maskedValue": "AKIA••••••••••••MPLE",
      "description": "Exposed AWS Access Key ID detected.",
      "remediation": "Move to AWS Secrets Manager or environment variables."
    }
  ]
}`}
            </pre>
          </div>

          {/* Security & Zero-Exposure */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Security &amp; Invariant Requirements
            </h2>
            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1.5">
              <li>Buffer scans are processed in-memory and <strong>never written to disk or telemetry</strong>.</li>
              <li>Editor diagnostic tooltips render the masked value and remediation instructions.</li>
              <li>Supports offline operation via local CLI process execution (`secretshield scan --staged --json`).</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
