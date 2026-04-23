import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';
import { generateSpotlightProse, slugify } from '../../../../lib/spotlight-prose.js';

// GET /api/admin/spotlights — list all spotlight articles
export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const articles = await prisma.spotlightArticle.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, slug: true, city: true, state: true, score: true,
      status: true, publishedAt: true, createdAt: true,
    },
  });

  return Response.json(articles);
}

// POST /api/admin/spotlights — generate a new spotlight article
export async function POST(request) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { city, state } = await request.json();
  if (!city || !state) {
    return Response.json({ error: 'City and state required' }, { status: 400 });
  }

  const slug = slugify(city, state);

  const existing = await prisma.spotlightArticle.findUnique({ where: { slug } });
  if (existing) {
    return Response.json({ error: `Spotlight for ${city}, ${state} already exists` }, { status: 409 });
  }

  const address = `Downtown ${city}, ${state}`;
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

  const prose = generateSpotlightProse(city, state, data);

  const article = await prisma.spotlightArticle.create({
    data: {
      slug, city, state,
      score: data.score,
      data: JSON.stringify(data),
      ...prose,
      status: 'draft',
    },
  });

  return Response.json({
    id: article.id, slug: article.slug, city: article.city,
    state: article.state, score: article.score, status: article.status,
  });
}
