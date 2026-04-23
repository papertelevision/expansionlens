import { getAdminSession } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/db.js';
import { cookies } from 'next/headers';
import { generateSpotlightProse, slugify } from '../../../../../lib/spotlight-prose.js';
import fs from 'fs';
import path from 'path';

// POST /api/admin/spotlights/auto-generate
// Picks the next city from the queue that hasn't been generated yet,
// runs the analysis, and auto-publishes. Accepts either admin session
// cookie (manual trigger) or SPOTLIGHT_SECRET bearer token (cron trigger).
export async function POST(request) {
  // Auth: session cookie OR bearer token
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.SPOTLIGHT_SECRET;
  const bearerValid = secret && authHeader === `Bearer ${secret}`;

  if (!admin && !bearerValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Load city queue
  let cities;
  try {
    const citiesPath = path.join(process.cwd(), 'scripts', 'spotlight-cities.json');
    cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
  } catch (e) {
    return Response.json({ error: 'Could not read spotlight-cities.json' }, { status: 500 });
  }

  // Find the next city not yet in the database
  const existingSlugs = new Set(
    (await prisma.spotlightArticle.findMany({ select: { slug: true } }))
      .map((a) => a.slug)
  );

  const nextCity = cities.find((c) => !existingSlugs.has(slugify(c.city, c.state)));
  if (!nextCity) {
    return Response.json({ message: 'All cities in the queue have been generated', done: true });
  }

  const { city, state, address } = nextCity;
  const slug = slugify(city, state);

  // Call the analyze API
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
    return Response.json({ error: `Analysis failed for ${city}, ${state}: ${e.message}` }, { status: 500 });
  }

  const prose = generateSpotlightProse(city, state, data);

  const article = await prisma.spotlightArticle.create({
    data: {
      slug, city, state,
      score: data.score,
      data: JSON.stringify(data),
      ...prose,
      status: 'published',
      publishedAt: new Date(),
    },
  });

  return Response.json({
    ok: true,
    city: article.city,
    state: article.state,
    score: article.score,
    slug: article.slug,
    url: `/blog/${article.slug}`,
  });
}
