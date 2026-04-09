import { getSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';
import { sendPurchaseConfirmationEmail } from '../../../../lib/email.js';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const user = await getSession(sessionCookie);

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { stripeSessionId, address, industry, lat, lon, reportData } = await request.json();

    if (!address || !reportData) {
      return Response.json({ error: 'Missing report data' }, { status: 400 });
    }

    // Check if already saved (idempotent)
    if (stripeSessionId) {
      const existing = await prisma.report.findFirst({
        where: { stripeSessionId },
      });
      if (existing) {
        return Response.json({ reportId: existing.id });
      }
    }

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        address,
        industry: industry || 'dental',
        lat: parseFloat(lat) || 0,
        lon: parseFloat(lon) || 0,
        reportData: typeof reportData === 'string' ? reportData : JSON.stringify(reportData),
        stripeSessionId: stripeSessionId || null,
      },
    });

    // Send confirmation email
    sendPurchaseConfirmationEmail(user.email, address, industry || 'dental', report.id)
      .catch((err) => console.warn('Purchase confirmation email failed:', err.message));

    return Response.json({ reportId: report.id });
  } catch (e) {
    console.error('Report save failed:', e);
    return Response.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
