import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight token verification for Edge middleware (avoid importing full jsonwebtoken if it uses node APIs that fail on Edge)
// Since we are running in Node.js serverless env, importing jsonwebtoken inside middleware might fail if Edge Runtime is selected.
// Next.js 14 App Router runs middleware on Edge runtime by default, which does not support node's crypto modules or jsonwebtoken easily.
// To avoid middleware compilation issues, we can check for the existence of the 'token' cookie, and rely on the individual API routes to perform cryptographic verification, OR we can decode it without verification in the middleware.
// Let's implement cookie check-only inside the middleware to ensure maximum Edge compatibility and zero runtime errors!

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users trying to access login/register
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
  ],
};
