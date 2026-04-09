import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { reports: true } },
    },
  });

  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      reportCount: u._count.reports,
      totalSpent: u._count.reports * 149,
      createdAt: u.createdAt,
    })),
  });
}
