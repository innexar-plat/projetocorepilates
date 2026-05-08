import type { MetadataRoute } from 'next';

const BASE_URL = 'https://corepilates.com';
const LOCALES = ['en', 'pt', 'es'] as const;

const ROUTES = [
  { path: '',        changeFrequency: 'weekly'  as const, priority: 1.0 },
  { path: '/planos', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/aulas',  changeFrequency: 'weekly'  as const, priority: 0.8 },
  { path: '/galeria',changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/blog',   changeFrequency: 'weekly'  as const, priority: 0.8 },
  { path: '/contato',changeFrequency: 'yearly'  as const, priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const languages = Object.fromEntries(
        LOCALES.map((localeCode) => [localeCode, `${BASE_URL}/${localeCode}${route.path}`]),
      );

      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages,
        },
      });
    }
  }

  return entries;
}
