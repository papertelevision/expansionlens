import { getAdminSession } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/db.js';
import { cookies } from 'next/headers';

// GET /api/admin/spotlights/[id] — get single article with full data
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const article = await prisma.spotlightArticle.findUnique({
    where: { id: params.id },
  });

  if (!article) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({
    ...article,
    data: JSON.parse(article.data),
  });
}

// PUT /api/admin/spotlights/[id] — update editable text fields
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { introText, cityContext, competitiveText, summaryText } = await request.json();

  const article = await prisma.spotlightArticle.update({
    where: { id: params.id },
    data: {
      ...(introText !== undefined && { introText }),
      ...(cityContext !== undefined && { cityContext }),
      ...(competitiveText !== undefined && { competitiveText }),
      ...(summaryText !== undefined && { summaryText }),
    },
  });

  return Response.json({ ok: true, id: article.id });
}

// DELETE /api/admin/spotlights/[id] — delete an article
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  await prisma.spotlightArticle.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
