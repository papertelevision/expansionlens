import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

function slugify(address) {
  return address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// GET /api/admin/promo-reports — list all promo reports
export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const reports = await prisma.promoReport.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, slug: true, address: true, industry: true,
      score: true, isPublic: true, createdAt: true,
    },
  });

  return Response.json(reports);
}

// POST /api/admin/promo-reports — generate a new promo report
export async function POST(request) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { address, industry } = await request.json();
  if (!address) {
    return Response.json({ error: 'Address is required' }, { status: 400 });
  }

  const ind = industry || 'dental';

  // Call the analyze API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let data;
  try {
    const res = await fetch(
      `${baseUrl}/api/analyze?address=${encodeURIComponent(address)}&industry=${encodeURIComponent(ind)}`,
      { signal: AbortSignal.timeout(120000) }
    );
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    data = await res.json();
    if (data.error) throw new Error(data.error);
  } catch (e) {
    return Response.json({ error: `Analysis failed: ${e.message}` }, { status: 500 });
  }

  // Generate unique slug
  let slug = slugify(address);
  const existing = await prisma.promoReport.findUnique({ where: { slug } });
  if (existing) slug = slug + '-' + Date.now().toString(36);

  const report = await prisma.promoReport.create({
    data: {
      slug,
      address: data.address || address,
      industry: ind,
      lat: data.lat || 0,
      lon: data.lon || 0,
      score: data.score || 0,
      reportData: JSON.stringify(data),
      isPublic: false,
    },
  });

  return Response.json({
    id: report.id, slug: report.slug, address: report.address,
    score: report.score, isPublic: report.isPublic,
  });
}
