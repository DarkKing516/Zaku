import { getIronSession, nextProxyCookies } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_ROUTE, LOGIN_ROUTE } from '@/shared/constants';
import { isActiveSession, sessionOptions, type SessionData } from '@/shared/server/session-options';

const PUBLIC_PATHS = ['/', LOGIN_ROUTE];

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));

// Optimistic check only: private pages call requireUser() and every BFF endpoint checks the session again.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(nextProxyCookies(request, response), sessionOptions());
  const isActive = isActiveSession(session);

  if (!isActive && session.user) {
    session.destroy();
  }

  if (!isActive && !isPublicPath(pathname)) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return redirectKeepingCookies(loginUrl, response);
  }

  if (isActive && pathname === LOGIN_ROUTE) {
    return redirectKeepingCookies(new URL(DEFAULT_ROUTE, request.url), response);
  }

  return response;
}

function redirectKeepingCookies(url: URL, response: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
