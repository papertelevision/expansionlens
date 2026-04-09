import { randomBytes, createHmac } from 'crypto';
import prisma from './db.js';
import { requireEnv } from './env.js';

const SESSION_SECRET = requireEnv('SESSION_SECRET', { minLength: 32 });
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 30;

export async function createMagicLink(email, pendingContext = {}) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  await prisma.magicLink.create({
    data: {
      email,
      token,
      userId: user.id,
      expiresAt,
      pendingAddress: pendingContext.address || null,
      pendingIndustry: pendingContext.industry || null,
      pendingLat: pendingContext.lat != null ? String(pendingContext.lat) : null,
      pendingLon: pendingContext.lon != null ? String(pendingContext.lon) : null,
    },
  });

  return token;
}

export async function verifyMagicLink(token) {
  const link = await prisma.magicLink.findUnique({ where: { token } });

  if (!link) return null;
  if (link.used) return null;
  if (link.expiresAt < new Date()) return null;

  // Mark as used
  await prisma.magicLink.update({
    where: { id: link.id },
    data: { used: true },
  });

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: link.email } });
  if (!user) {
    user = await prisma.user.create({ data: { email: link.email } });
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  // Sign the session ID
  const signedValue = signSession(session.id);

  return {
    sessionCookie: signedValue,
    user,
    pendingContext: {
      address: link.pendingAddress,
      industry: link.pendingIndustry,
      lat: link.pendingLat,
      lon: link.pendingLon,
    },
  };
}

export async function getSession(cookieValue) {
  if (!cookieValue) return null;

  const sessionId = verifySignedSession(cookieValue);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function getAdminSession(cookieValue) {
  const user = await getSession(cookieValue);
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function clearSession(cookieValue) {
  if (!cookieValue) return;
  const sessionId = verifySignedSession(cookieValue);
  if (!sessionId) return;
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch (e) {
    // Session may already be deleted
  }
}

function signSession(sessionId) {
  const sig = createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedSession(value) {
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, sig] = parts;
  const expected = createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  if (sig !== expected) return null;
  return sessionId;
}
