import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt', 'es'],
  defaultLocale: 'en',
  // Detects the user's preferred language from the browser's Accept-Language header.
  // When a user visits for the first time, they are automatically redirected
  // to their browser/device language if it matches one of the supported locales.
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
