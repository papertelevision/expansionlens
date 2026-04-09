import { getSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const user = await getSession(sessionCookie);

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const report = await prisma.report.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!report) {
    return Response.json({ error: 'Report not found' }, { status: 404 });
  }

  return Response.json({
    id: report.id,
    address: report.address,
    industry: report.industry,
    data: JSON.parse(report.reportData),
    createdAt: report.createdAt,
  });
}
