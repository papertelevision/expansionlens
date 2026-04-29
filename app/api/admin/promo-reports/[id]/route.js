import { getAdminSession } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/db.js';
import { cookies } from 'next/headers';

// GET /api/admin/promo-reports/[id] — report details + view log
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const report = await prisma.promoReport.findUnique({
    where: { id: params.id },
    include: {
      views: {
        orderBy: { viewedAt: 'desc' },
        take: 50,
        select: { id: true, referrer: true, deviceType: true, ip: true, viewedAt: true },
      },
      _count: { select: { views: true } },
    },
  });

  if (!report) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({
    id: report.id, slug: report.slug, address: report.address,
    industry: report.industry, score: report.score, isPublic: report.isPublic,
    createdAt: report.createdAt, viewCount: report._count.views,
    views: report.views,
  });
}

// PUT /api/admin/promo-reports/[id] — toggle public/private
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const report = await prisma.promoReport.findUnique({ where: { id: params.id } });
  if (!report) return Response.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.promoReport.update({
    where: { id: params.id },
    data: { isPublic: !report.isPublic },
  });

  return Response.json({ ok: true, isPublic: updated.isPublic });
}

// DELETE /api/admin/promo-reports/[id]
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  await prisma.promoReport.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
