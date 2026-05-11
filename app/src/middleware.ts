import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_SEGMENTS = ['/login', '/cadastro', '/planos', '/checkout', '/blog', '/galeria', '/contato', '/professores'];
const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

/** Strip leading locale segment (e.g. /pt/portal → /portal) */
function stripLocale(pathname: string): string {
  const localePrefix = /^\/(en|pt|es)(\/|$)/;
  return pathname.replace(localePrefix, '/');
}

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Skip middleware for API routes (they handle auth themselves)
  if (pathname.startsWith('/api/')) return NextResponse.next();

  // Apply i18n locale detection + redirect
  const intlResponse = intlMiddleware(req as NextRequest);

  const bare = stripLocale(pathname);

  const isPublic =
    bare === '/' ||
    PUBLIC_SEGMENTS.some((p) => bare === p || bare.startsWith(p + '/'));
  if (isPublic) return intlResponse ?? NextResponse.next();

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => Boolean(req.cookies.get(name)?.value));
  if (!hasSessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse ?? NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
