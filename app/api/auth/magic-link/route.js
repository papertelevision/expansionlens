import { createMagicLink } from '../../../../lib/auth.js';
import { sendMagicLinkEmail } from '../../../../lib/email.js';

export async function POST(request) {
  try {
    const { email, address, industry, lat, lon } = await request.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const token = await createMagicLink(email, { address, industry, lat, lon });

    const host = request.headers.get('host') || 'localhost:3003';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = request.headers.get('origin') || `${proto}://${host}`;
    const magicLinkUrl = `${origin}/api/auth/verify?token=${token}`;

    await sendMagicLinkEmail(email, magicLinkUrl);

    return Response.json({ sent: true });
  } catch (e) {
    console.error('Magic link creation failed:', e);
    return Response.json({ error: 'Failed to send login link' }, { status: 500 });
  }
}
