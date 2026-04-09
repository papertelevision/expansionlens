import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  // Get event counts by type
  const events = await prisma.analyticsEvent.groupBy({
    by: ['event'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  // Get recent events
  const recent = await prisma.analyticsEvent.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Get daily event counts for the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyEvents = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { event: true, createdAt: true },
  });

  // Group by day
  const daily = {};
  dailyEvents.forEach((e) => {
    const day = e.createdAt.toISOString().split('T')[0];
    if (!daily[day]) daily[day] = {};
    if (!daily[day][e.event]) daily[day][e.event] = 0;
    daily[day][e.event]++;
  });

  // Get traffic sources from landing_page_view events
  const pageViews = await prisma.analyticsEvent.findMany({
    where: { event: 'landing_page_view' },
    select: { meta: true },
  });

  const sources = {};
  pageViews.forEach((e) => {
    try {
      const meta = JSON.parse(e.meta || '{}');
      const src = meta.source || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    } catch (err) {}
  });

  // Sort sources by count
  const sortedSources = Object.entries(sources)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return Response.json({
    totals: events.map((e) => ({ event: e.event, count: e._count.id })),
    sources: sortedSources,
    recent: recent.map((e) => {
      let meta = null;
      try { meta = JSON.parse(e.meta || 'null'); } catch (err) {}
      return {
        id: e.id,
        event: e.event,
        page: e.page,
        industry: e.industry,
        address: e.address,
        source: meta?.source || null,
        createdAt: e.createdAt,
      };
    }),
    daily,
  });
}
