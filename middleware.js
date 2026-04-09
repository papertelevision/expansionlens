import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/account'];

// Routes that require admin
const adminRoutes = ['/admin'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Check protected routes (user must be logged in)
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin routes — cookie must exist (admin check happens in the layout/API)
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdmin && !sessionCookie) {
    // Allow access to admin login page (the layout handles showing the login form)
    // So we just let it through — the admin layout checks isAdmin server-side
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/admin/:path*'],
};
