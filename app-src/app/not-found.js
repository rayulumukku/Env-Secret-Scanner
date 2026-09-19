import Link from 'next/link';
import { FileQuestion, Home, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Page Not Found — 404',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border border-border/60 bg-card/60 shadow-xl backdrop-blur">
        <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center mx-auto mb-5 text-muted-foreground">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          404 ERROR
        </span>

        <h1 className="text-2xl font-bold tracking-tight mt-3 mb-2">Page Not Found</h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The page or resource you requested could not be located. It may have been moved or removed.
        </p>

        <div className="space-y-2.5">
          <Link href="/" className="block w-full">
            <Button size="lg" className="w-full gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Home className="w-4 h-4" aria-hidden="true" />
              Return Home
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link href="/scan" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                Scan Code
              </Button>
            </Link>
            <Link href="/docs" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
