import { getAdminSession } from '../../../../../../lib/auth.js';
import prisma from '../../../../../../lib/db.js';
import { cookies } from 'next/headers';

// PUT /api/admin/blog-posts/[id]/publish
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 });

  const newStatus = post.status === 'published' ? 'draft' : 'published';

  await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      publishedAt: newStatus === 'published' ? new Date() : null,
    },
  });

  return Response.json({ ok: true, status: newStatus });
}
