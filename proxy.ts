import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if any cookie name contains 'insforge' or 'session'
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (cookie) => cookie.name.toLowerCase().includes('insforge') || cookie.name.toLowerCase().includes('session') || cookie.name.toLowerCase().includes('auth')
  );

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/find-jobs');

  if (isProtectedRoute && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/find-jobs/:path*'],
};
