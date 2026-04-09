import { verifyMagicLink } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const host = request.headers.get('host') || 'localhost:3003';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  if (!token) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_token`);
  }

  const result = await verifyMagicLink(token);

  if (!result) {
    return NextResponse.redirect(`${origin}/?auth_error=invalid_or_expired`);
  }

  const { sessionCookie, pendingContext } = result;

  // Build redirect URL
  let redirectUrl = `${origin}/dashboard`;
  if (pendingContext.address) {
    const params = new URLSearchParams();
    params.set('address', pendingContext.address);
    if (pendingContext.industry) params.set('industry', pendingContext.industry);
    if (pendingContext.lat) params.set('lat', pendingContext.lat);
    if (pendingContext.lon) params.set('lon', pendingContext.lon);
    params.set('proceed_to_checkout', 'true');
    redirectUrl = `${origin}/report?${params.toString()}`;
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('session', sessionCookie, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
