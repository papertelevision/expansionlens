import { getAdminSession } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/db.js';
import { cookies } from 'next/headers';

// GET /api/admin/blog-posts/[id]
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ ...post, faqEntries: JSON.parse(post.faqEntries || '[]') });
}

// PUT /api/admin/blog-posts/[id] — update editable fields
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { title, excerpt, content } = await request.json();

  await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
    },
  });

  return Response.json({ ok: true });
}

// DELETE /api/admin/blog-posts/[id]
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  await prisma.blogPost.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
