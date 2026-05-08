import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import '../globals.css';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const BASE_URL = 'https://corepilates.com';

const OPEN_GRAPH_LOCALE_MAP: Record<Locale, string> = {
  en: 'en_US',
  pt: 'pt_BR',
  es: 'es_ES',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = routing.locales.includes(locale as Locale) ? (locale as Locale) : 'en';
  const googleVerificationToken = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
      default: 'Core Pilates Miami — Transform Your Body & Mind',
      template: '%s | Core Pilates Miami',
    },
    description:
      'Premium Pilates studio in Miami, FL. Join 500+ students and discover the most effective method for strength, flexibility and well-being. Book your trial class today.',
    keywords: [
      'pilates miami',
      'pilates studio miami',
      'reformer pilates',
      'mat pilates',
      'pilates classes',
      'core strength',
      'flexibility training',
      'wellness miami',
    ],
    authors: [{ name: 'Core Pilates Miami' }],
    creator: 'Core Pilates Miami',
    alternates: {
      canonical: `${BASE_URL}/${normalizedLocale}`,
      languages: {
        en: '/en',
        pt: '/pt',
        es: '/es',
      },
    },
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE_MAP[normalizedLocale],
      alternateLocale: Object.entries(OPEN_GRAPH_LOCALE_MAP)
        .filter(([key]) => key !== normalizedLocale)
        .map(([, value]) => value),
      siteName: 'Core Pilates Miami',
      title: 'Core Pilates Miami — Transform Your Body & Mind',
      description:
        'Premium Pilates studio in Miami, FL. 500+ students, certified instructors, reformer & mat classes.',
      url: `${BASE_URL}/${normalizedLocale}`,
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Core Pilates Miami Studio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Core Pilates Miami',
      description: 'Premium Pilates studio in Miami. Transform your body and mind.',
      images: ['/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };

  if (googleVerificationToken) {
    metadata.verification = { google: googleVerificationToken };
  }

  return metadata;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
