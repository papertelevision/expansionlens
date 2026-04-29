import prisma from '../../../../lib/db.js';

function getDeviceType(ua) {
  if (!ua) return 'Unknown';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function parseReferrer(ref) {
  if (!ref) return 'Direct';
  try {
    const host = new URL(ref).hostname.replace('www.', '');
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('twitter') || host.includes('x.com')) return 'Twitter/X';
    return host;
  } catch {
    return ref.slice(0, 100);
  }
}

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// GET /api/promo-reports/[slug] — public endpoint, no auth required.
// Returns the full report data if the promo report exists and is public.
// Tracks each view with referrer, device type, and timestamp.
export async function GET(request, { params }) {
  const report = await prisma.promoReport.findUnique({
    where: { slug: params.slug },
  });

  if (!report || !report.isPublic) {
    return Response.json({ error: 'Report not found' }, { status: 404 });
  }

  // Track the view asynchronously (don't block the response)
  const ua = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';
  const ip = getClientIp(request);

  prisma.promoReportView.create({
    data: {
      reportId: report.id,
      referrer: parseReferrer(referrer),
      userAgent: ua.slice(0, 500),
      deviceType: getDeviceType(ua),
      ip: ip.slice(0, 45),
    },
  }).catch(() => {}); // Fire and forget — don't fail the response if tracking fails

  return Response.json({
    id: report.id,
    address: report.address,
    industry: report.industry,
    data: JSON.parse(report.reportData),
  });
}
