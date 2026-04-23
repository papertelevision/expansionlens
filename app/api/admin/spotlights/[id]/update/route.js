import { getAdminSession } from '../../../../../../lib/auth.js';
import prisma from '../../../../../../lib/db.js';
import { cookies } from 'next/headers';

// PUT /api/admin/spotlights/[id]/update — re-run analysis, refresh data + score,
// preserve the user's edited text fields
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const article = await prisma.spotlightArticle.findUnique({
    where: { id: params.id },
  });
  if (!article) return Response.json({ error: 'Not found' }, { status: 404 });

  // Re-run the analysis
  const address = `Downtown ${article.city}, ${article.state}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  let data;
  try {
    const res = await fetch(
      `${baseUrl}/api/analyze?address=${encodeURIComponent(address)}&industry=dental`,
      { signal: AbortSignal.timeout(120000) }
    );
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    data = await res.json();
    if (data.error) throw new Error(data.error);
  } catch (e) {
    return Response.json({ error: `Analysis failed: ${e.message}` }, { status: 500 });
  }

  // Update score + data but keep the edited text fields
  await prisma.spotlightArticle.update({
    where: { id: params.id },
    data: {
      score: data.score,
      data: JSON.stringify(data),
    },
  });

  return Response.json({ ok: true, score: data.score });
}
