import { notFound } from 'next/navigation';
import { DocLayout, CodeBlock } from '@/components/docs/DocLayout';
import { DOC_PAGES } from '@/lib/docs/data';

export async function generateStaticParams() {
  return Object.keys(DOC_PAGES).map(slug => ({
    slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = DOC_PAGES[slug];
  if (!page) return { title: 'Documentation — SecretShield' };

  return {
    title: `${page.title} — SecretShield Docs`,
    description: page.description,
  };
}

export default async function DocTopicPage({ params }) {
  const { slug } = await params;
  const page = DOC_PAGES[slug];

  if (!page) {
    notFound();
  }

  // Parse markdown content into structured sections and code blocks
  const lines = page.content.trim().split('\n');
  const renderedElements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLanguage = 'bash';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.replace('```', '').trim() || 'text';
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        renderedElements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBuffer.join('\n')}
            language={codeLanguage}
          />
        );
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '').trim();
      const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      renderedElements.push(
        <h2 key={`h2-${i}`} id={headingId} className="text-xl font-bold text-foreground mt-8 mb-3 pt-2 border-b border-border/30 pb-2 scroll-mt-24">
          {headingText}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      const headingText = line.replace('### ', '').trim();
      const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      renderedElements.push(
        <h3 key={`h3-${i}`} id={headingId} className="text-base font-bold text-foreground mt-6 mb-2 scroll-mt-24">
          {headingText}
        </h3>
      );
      continue;
    }

    if (line.startsWith('> [!IMPORTANT]')) {
      renderedElements.push(
        <div key={`alert-${i}`} className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-medium my-4">
          <strong>IMPORTANT:</strong> {lines[i + 1]?.replace(/^>\s*/, '')}
        </div>
      );
      i++; // skip next line
      continue;
    }

    if (line.trim().startsWith('- ')) {
      renderedElements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 list-disc leading-relaxed">
          {line.replace(/^-\s*/, '')}
        </li>
      );
      continue;
    }

    if (line.trim().startsWith('1. ') || line.trim().startsWith('2. ') || line.trim().startsWith('3. ') || line.trim().startsWith('4. ')) {
      renderedElements.push(
        <div key={`ol-${i}`} className="text-sm text-muted-foreground ml-2 leading-relaxed">
          {line}
        </div>
      );
      continue;
    }

    if (line.trim()) {
      renderedElements.push(
        <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed my-2">
          {line}
        </p>
      );
    }
  }

  return (
    <DocLayout currentSlug={slug}>
      <div className="space-y-4">
        {renderedElements}
      </div>
    </DocLayout>
  );
}
