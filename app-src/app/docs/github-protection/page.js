import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  Lock, 
  ArrowLeft, 
  FileCode2, 
  AlertTriangle 
} from 'lucide-react';

export const metadata = {
  title: 'GitHub Branch Protection Guide | SecretShield',
  description: 'How to enforce automated secret scanning via GitHub Branch Protection Rules and Rulesets.',
};

export default function GitHubProtectionDocPage() {
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
            <Lock className="w-7 h-7 text-indigo-400" />
            GitHub Branch Protection Guide
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Configure GitHub Branch Protection Rules to require passing SecretShield security checks before code can be merged.
          </p>
        </div>

        <div className="space-y-8 mt-8 text-sm text-gray-300 leading-relaxed">
          {/* Overview */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              How Status Checks Work
            </h2>
            <p>
              When the SecretShield GitHub App is installed on your repository, every opened or updated Pull Request automatically triggers a lightweight, focused scan on changed files. SecretShield publishes a <strong>GitHub Check Run</strong> named:
            </p>
            <div className="p-3 bg-gray-900 border border-gray-800 rounded font-mono text-indigo-300 text-xs">
              SecretShield Security Scan
            </div>
            <p>
              If secrets above your project's configured severity threshold (e.g. Critical or High) are detected, the Check Run reports <code className="text-rose-400">failure</code>, blocking merges until the developer removes or rotates the secret.
            </p>
          </div>

          {/* Step by Step */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-6">
            <h2 className="text-lg font-bold text-white">Step-by-Step Configuration</h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                  Open Repository Branch Settings
                </h3>
                <p className="text-xs text-gray-400">
                  On GitHub, navigate to your repository &gt; <strong>Settings</strong> &gt; <strong>Branches</strong> (or <strong>Rules &gt; Rulesets</strong>).
                </p>
              </div>

              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                  Add Branch Protection Rule
                </h3>
                <p className="text-xs text-gray-400">
                  Click <strong>Add branch protection rule</strong> and enter <code className="text-indigo-300 font-mono">main</code> (or your default branch pattern).
                </p>
              </div>

              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                  Require Status Checks
                </h3>
                <p className="text-xs text-gray-400">
                  Check the option <strong>Require status checks to pass before merging</strong>. In the search box, search for:
                </p>
                <div className="p-2 bg-[#0d1117] rounded border border-gray-800 font-mono text-indigo-300 text-xs">
                  SecretShield Security Scan
                </div>
                <p className="text-xs text-gray-400">
                  Select it and check <strong>Require branches to be up to date before merging</strong>.
                </p>
              </div>

              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
                  Save Changes
                </h3>
                <p className="text-xs text-gray-400">
                  Click <strong>Save changes</strong>. Pull requests targeting this branch will now strictly require passing SecretShield scans before merging.
                </p>
              </div>
            </div>
          </div>

          {/* Zero-Exposure Guarantee */}
          <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Zero-Exposure Invariant
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              SecretShield check outputs and pull request comments never contain raw credentials. Annotations identify the file, line number, rule name, confidence score, and remediation steps while masking sensitive token values.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
