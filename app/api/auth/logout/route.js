import { clearSession } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  await clearSession(sessionCookie);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });

  return response;
}
