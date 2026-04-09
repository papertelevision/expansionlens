import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const industryFilter = searchParams.get('industry');

  const where = industryFilter ? { industry: industryFilter } : {};

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
  });

  return Response.json({
    reports: reports.map((r) => {
      let score = null;
      try { score = JSON.parse(r.reportData).score; } catch (e) {}
      return {
        id: r.id,
        address: r.address,
        industry: r.industry,
        score,
        email: r.user.email,
        stripeSessionId: r.stripeSessionId,
        createdAt: r.createdAt,
      };
    }),
  });
}
