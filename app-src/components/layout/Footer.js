import Link from 'next/link';
import { Shield, GitBranch, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { href: '/scan', label: 'Scanner' },
    { href: '/history', label: 'Scan History' },
    { href: '/rules', label: 'Custom Rules' },
    { href: '/settings', label: 'Settings' },
  ],
  Resources: [
    { href: '/docs', label: 'Documentation' },
    { href: '/docs#api', label: 'API Reference' },
    { href: '/docs#rules', label: 'Detection Rules' },
    { href: '/docs#faq', label: 'FAQ' },
  ],
  Integrations: [
    { href: '#', label: 'GitHub Actions (soon)', disabled: true },
    { href: '#', label: 'GitLab CI (soon)', disabled: true },
    { href: '#', label: 'CLI Tool (soon)', disabled: true },
    { href: '#', label: 'VS Code (soon)', disabled: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-base">
                Secret<span className="text-primary">Shield</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Detect accidentally exposed API keys, tokens, and secrets in source code before they reach production.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com/rayulumukku/Env-Secret-Scanner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <GitBranch className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Scans run locally — no data sent to servers
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    {link.disabled ? (
                      <span className="text-sm text-muted-foreground/40 cursor-not-allowed flex items-center gap-1">
                        {link.label}
                      </span>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 SecretShield. Built for developers who care about security.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="font-mono text-primary">v1.0.0</span> MVP
            </span>
            <span>Privacy-first · Open source</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
