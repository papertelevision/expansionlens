import { createHmac } from 'crypto';
import prisma from '../../../../lib/db.js';
import { NextResponse } from 'next/server';
import { requireEnv } from '../../../../lib/env.js';
import { verifyAdminPassword } from '../../../../lib/admin-password.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';

const SESSION_SECRET = requireEnv('SESSION_SECRET', { minLength: 32 });

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`admin-login:${ip}`, {
      max: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!limit.allowed) {
      return Response.json(
        { error: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isAdmin || !user.adminPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!verifyAdminPassword(password, user.adminPassword)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create a session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const sig = createHmac('sha256', SESSION_SECRET).update(session.id).digest('hex');
    const sessionCookie = `${session.id}.${sig}`;

    const response = NextResponse.json({ ok: true });
    response.cookies.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (e) {
    console.error('Admin login failed:', e);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
