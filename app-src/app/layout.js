import './globals.css';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: {
    default: 'SecretShield — Env Secret Scanner for Developers',
    template: '%s | SecretShield',
  },
  description:
    'Detect accidentally exposed API keys, tokens, passwords, and secrets in your source code before they reach production. Free, open, privacy-first.',
  keywords: [
    'secret scanner', 'api key detector', 'credential leakage', 'env secret',
    'security scanner', 'developer security', 'secret detection', 'SAST',
    'AWS key scanner', 'GitHub token scanner', 'OpenAI key leak',
  ],
  authors: [{ name: 'SecretShield' }],
  creator: 'SecretShield',
  metadataBase: new URL('https://secretshield.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://secretshield.dev',
    title: 'SecretShield — Env Secret Scanner',
    description: 'Detect exposed API keys, tokens, and secrets in source code. Free, private, no data leaves your browser.',
    siteName: 'SecretShield',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecretShield — Find Secrets Before They Find Production',
    description: 'Free secret scanner for developers. Detect AWS keys, GitHub tokens, Stripe keys, and more.',
    creator: '@secretshield',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SecretShield',
  applicationCategory: 'DeveloperApplication',
  description: 'Detect accidentally exposed API keys, tokens, passwords, and secrets in source code.',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  url: 'https://secretshield.dev',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
