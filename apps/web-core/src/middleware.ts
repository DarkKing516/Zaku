import { GetSession } from '@/utils/session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = (await GetSession()).user;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isLandingPage = request.nextUrl.pathname === '/';

  // Si ya está logueado y trata de ir al login, redirigir al home
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Si no hay sesión y no es una página pública, redirigir al login
  if (!session && !isLoginPage && !isLandingPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
