import { auth } from '@/lib/auth';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_SEGMENTS = ['/login', '/cadastro', '/planos', '/blog', '/galeria', '/contato'];
const PORTAL_PREFIX = '/portal';
const ADMIN_PREFIX = '/admin';
const API_ADMIN_PREFIX = '/api/v1/admin';

/** Strip leading locale segment (e.g. /pt/portal → /portal) */
function stripLocale(pathname: string): string {
  const localePrefix = /^\/(en|pt|es)(\/|$)/;
  return pathname.replace(localePrefix, '/');
}

export default auth(async function middleware(req: NextRequest & { auth: any }) {
  const { nextUrl, auth: session } = req as any;
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

  const isPortal = bare.startsWith(PORTAL_PREFIX);
  const isAdmin = bare.startsWith(ADMIN_PREFIX) || pathname.startsWith(API_ADMIN_PREFIX);

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && session.user?.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  return intlResponse ?? NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
