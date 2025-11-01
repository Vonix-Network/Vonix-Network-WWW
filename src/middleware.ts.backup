import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '../auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  const token = session?.user;

  // Create response
  let response = NextResponse.next();

  // Redirect logged-in users away from auth pages
  if (token && (pathname === '/login' || pathname === '/register')) {
    response = NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/social') || 
      pathname.startsWith('/messages') || 
      pathname.startsWith('/settings')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      response = NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin routes - require admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else if ((token as any).role !== 'admin') {
      response = NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect moderation routes - require moderator or admin role
  if (pathname.startsWith('/moderation')) {
    if (!token) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else if ((token as any).role !== 'admin' && (token as any).role !== 'moderator') {
      response = NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add security headers
  const headers = response.headers;
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy (adjust as needed for your app)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/social/:path*',
    '/forum/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/moderation/:path*',
    '/login',
    '/register',
  ],
};
