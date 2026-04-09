import { getSession } from '../../../lib/auth.js';
import prisma from '../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const user = await getSession(sessionCookie);

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      address: true,
      industry: true,
      createdAt: true,
      reportData: true,
    },
  });

  // Parse score from reportData for the list view
  const summaries = reports.map((r) => {
    let score = null;
    try {
      const data = JSON.parse(r.reportData);
      score = data.score;
    } catch (e) {}
    return {
      id: r.id,
      address: r.address,
      industry: r.industry,
      score,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ reports: summaries });
}
