import prisma from '../../../lib/db.js';
import { getSession } from '../../../lib/auth.js';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { event, page, industry, address, meta } = await request.json();

    if (!event) {
      return Response.json({ error: 'Event name required' }, { status: 400 });
    }

    // Optionally capture user ID if logged in
    let userId = null;
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('session')?.value;
      const user = await getSession(sessionCookie);
      if (user) userId = user.id;
    } catch (e) {}

    await prisma.analyticsEvent.create({
      data: {
        event,
        page: page || null,
        industry: industry || null,
        address: address || null,
        userId,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });

    return Response.json({ ok: true });
  } catch (e) {
    // Don't fail the user experience for analytics errors
    console.warn('Analytics event failed:', e.message);
    return Response.json({ ok: true });
  }
}
