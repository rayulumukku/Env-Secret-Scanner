export default function sitemap() {
  const baseUrl = 'https://secretshield.dev';
  const routes = ['', '/scan', '/results', '/history', '/rules', '/settings', '/docs'];

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/scan' ? 0.9 : 0.7,
  }));
}
