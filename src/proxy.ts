import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'access_token';
const AUTH_PAGES = ['/login', '/register'];
const CUSTOMER_PAGES = ['/account', '/checkout', '/orders'];
const ADMIN_PAGES = ['/admin', '/print'];

interface TokenPayload {
  role?: 'admin' | 'customer';
  exp?: number;
}

/** Reads (does NOT verify) the JWT payload for fast redirects. NestJS enforces real security. */
function readToken(token?: string): TokenPayload | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as TokenPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const payload = readToken(request.cookies.get(AUTH_COOKIE)?.value);
  const isLoggedIn = !!payload;

  const isAdminPage = ADMIN_PAGES.some((base) => matches(pathname, base));
  const isCustomerPage = CUSTOMER_PAGES.some((base) => matches(pathname, base));

  if ((isAdminPage || isCustomerPage) && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (isAdminPage && payload?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (AUTH_PAGES.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL(payload?.role === 'admin' ? '/admin' : '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/print/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/login',
    '/register',
  ],
};