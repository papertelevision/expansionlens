import prisma from '../../../../lib/db.js';

// GET /api/promo-reports/[slug] — public endpoint, no auth required.
// Returns the full report data if the promo report exists and is public.
export async function GET(request, { params }) {
  const report = await prisma.promoReport.findUnique({
    where: { slug: params.slug },
  });

  if (!report || !report.isPublic) {
    return Response.json({ error: 'Report not found' }, { status: 404 });
  }

  return Response.json({
    id: report.id,
    address: report.address,
    industry: report.industry,
    data: JSON.parse(report.reportData),
  });
}
