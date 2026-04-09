import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const [userCount, reportCount, recentReports] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.report.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    }),
  ]);

  const revenue = reportCount * 149;

  const recent = recentReports.map((r) => {
    let score = null;
    try { score = JSON.parse(r.reportData).score; } catch (e) {}
    return {
      id: r.id,
      address: r.address,
      industry: r.industry,
      score,
      email: r.user.email,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ userCount, reportCount, revenue, recent });
}
