import { DOC_PAGES } from '@/lib/docs/data';

export default function sitemap() {
  const baseUrl = 'https://secretshield.dev';
  const staticRoutes = [
    { path: '', priority: 1.0, freq: 'weekly' },
    { path: '/scan', priority: 0.9, freq: 'weekly' },
    { path: '/docs', priority: 0.85, freq: 'weekly' },
    { path: '/status', priority: 0.8, freq: 'daily' },
    { path: '/security', priority: 0.8, freq: 'monthly' },
    { path: '/privacy', priority: 0.7, freq: 'monthly' },
    { path: '/terms', priority: 0.6, freq: 'monthly' },
    { path: '/rules', priority: 0.75, freq: 'weekly' },
    { path: '/rules/lab', priority: 0.75, freq: 'weekly' },
  ];

  const docRoutes = Object.keys(DOC_PAGES).map(slug => ({
    path: `/docs/${slug}`,
    priority: 0.8,
    freq: 'weekly',
  }));

  const allRoutes = [...staticRoutes, ...docRoutes];

  return allRoutes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.freq,
    priority: route.priority,
  }));
}
