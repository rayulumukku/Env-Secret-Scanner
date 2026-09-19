import Link from 'next/link';
import { Shield, GitBranch, Heart, CheckCircle, Activity, BookOpen, Lock } from 'lucide-react';
import { VERSION_INFO } from '@/lib/version';

const FOOTER_LINKS = {
  Product: [
    { href: '/scan', label: 'Scanner' },
    { href: '/projects', label: 'Projects' },
    { href: '/findings', label: 'Findings Hub' },
    { href: '/remediation', label: 'Remediation' },
    { href: '/rules/lab', label: 'Rule Safety Lab' },
    { href: '/status', label: 'System Status' },
  ],
  Documentation: [
    { href: '/docs', label: 'Docs Overview' },
    { href: '/docs/getting-started', label: 'Quickstart Guide' },
    { href: '/docs/cli', label: 'CLI & Pre-commit' },
    { href: '/docs/github', label: 'GitHub App & PRs' },
    { href: '/docs/custom-rules', label: 'Custom Regex Rules' },
    { href: '/docs/api', label: 'REST API' },
  ],
  Security: [
    { href: '/security', label: 'Security Disclosure' },
    { href: '/docs/privacy', label: 'Privacy Architecture' },
    { href: '/settings/system-health', label: 'System Health' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand & Privacy Pledge */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-base">
                Secret<span className="text-primary">Shield</span>
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Developer security platform that scans repositories, commits, and pull requests for exposed credentials — without sending your source code to an AI service.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href={VERSION_INFO.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs"
                aria-label="GitHub Repository"
              >
                <GitBranch className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Systems Operational</span>
              </Link>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/70 border border-border/50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Zero external AI APIs · Masked findings only</span>
            </div>
          </div>

          {/* Navigation Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SecretShield. Built for engineering teams who take security seriously.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-primary font-semibold">v{VERSION_INFO.version}</span>
            <span>MIT License</span>
            <Link href="/security" className="hover:text-foreground transition-colors underline underline-offset-4">
              Responsible Disclosure
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
