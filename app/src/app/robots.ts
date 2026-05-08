import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/cadastro',
          '/portal/',
          '/checkout/',
          '/qrcode',
          '/en/admin/',
          '/pt/admin/',
          '/es/admin/',
          '/en/login',
          '/pt/login',
          '/es/login',
          '/en/cadastro',
          '/pt/cadastro',
          '/es/cadastro',
          '/en/portal/',
          '/pt/portal/',
          '/es/portal/',
          '/en/checkout/',
          '/pt/checkout/',
          '/es/checkout/',
          '/en/qrcode',
          '/pt/qrcode',
          '/es/qrcode',
        ],
      },
    ],
    sitemap: 'https://corepilates.com/sitemap.xml',
    host: 'https://corepilates.com',
  };
}
