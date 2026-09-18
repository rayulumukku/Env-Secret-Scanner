import { Shield, Lock, Eye, Server, AlertTriangle, Check } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — SecretShield',
  description: 'How SecretShield handles your code, secrets, and data. We never intentionally persist raw secrets.',
};

const SECTIONS = [
  {
    icon: Shield,
    title: 'What SecretShield Does',
    color: 'text-primary',
    items: [
      'SecretShield scans source code files and ZIP archives to detect accidentally exposed credentials, API keys, tokens, and other secrets.',
      'Detection is performed using pattern matching, entropy analysis, and contextual heuristics entirely on our server.',
      'No third-party AI or machine learning services are used in the detection pipeline.',
      'Scan results contain masked credential values (e.g., AKIA••••EXAMPLE) — never the raw secret.',
    ],
  },
  {
    icon: Server,
    title: 'What We Process',
    color: 'text-blue-400',
    items: [
      'When you upload a ZIP archive, the file is held in memory on our server only for the duration of the scan.',
      'File content is read, scanned, and immediately discarded — it is never written to disk or a database.',
      'Scan findings (masked values, fingerprints, file paths, line numbers) are returned to your browser.',
      'We do not store, index, or retain your source code or file content in any form.',
    ],
  },
  {
    icon: Lock,
    title: 'What We Never Do With Secrets',
    color: 'text-emerald-400',
    items: [
      'Raw secret values are never written to a database or log file.',
      'Raw secret values are never included in API responses or server logs.',
      'Raw secret values are never sent to third-party services, analytics, or AI APIs.',
      'Raw secret values are never stored in browser localStorage, cookies, or URL parameters.',
    ],
  },
  {
    icon: Eye,
    title: 'Scan Result Storage',
    color: 'text-yellow-400',
    items: [
      'Scan metadata (scan ID, file count, finding counts, masked values, timestamps) is stored in your browser\'s sessionStorage for the current session only.',
      'A summary of recent scans is stored in your browser\'s localStorage for scan history display. This contains only safe metadata.',
      'localStorage data never leaves your device — it is not transmitted to our servers.',
      'You can clear scan history at any time from the History or Settings page.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'What We Cannot Guarantee',
    color: 'text-orange-400',
    items: [
      'This is an MVP product. While we make every reasonable effort to protect your data, we do not make legally binding privacy or security guarantees at this stage.',
      'Server-side memory may contain file content briefly during scanning. Normal server security practices apply.',
      'We cannot prevent misuse of scan results if they are shared or exported by you.',
      'If you are scanning production secrets, we recommend revoking and rotating them regardless of scan results.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">SecretShield MVP · Last updated September 2026</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <strong>Core principle:</strong> SecretShield is designed so that raw secret values never leave
                the momentary scan pipeline. We process your code only to detect secrets — not to store, analyze, or monetize it.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ icon: Icon, title, color, items }) => (
            <section key={title}>
              <div className="flex items-center gap-2.5 mb-4">
                <Icon className={`w-5 h-5 ${color}`} />
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              </div>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-border flex-shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 pt-8 border-t border-border/40">
          <h2 className="text-base font-semibold mb-2">Questions?</h2>
          <p className="text-sm text-muted-foreground">
            If you have questions about how SecretShield handles your data, open an issue on our GitHub repository.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            <strong>Note:</strong> Raw secret values are never intentionally persisted by SecretShield.
            This document describes our design intent, not a legal contract or compliance certification.
          </div>
        </div>
      </div>
    </div>
  );
}
