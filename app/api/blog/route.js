import prisma from '../../../lib/db.js';

export const dynamic = 'force-dynamic';

// Static hand-written articles
const staticArticles = [
  {
    slug: 'how-to-choose-dental-practice-location',
    category: 'Dental Expansion',
    title: 'How to Choose a Location for a New Dental Practice',
    excerpt: 'A data-driven framework for evaluating dental practice locations. Learn the demographic, competitive, and economic factors that determine whether a new practice will thrive or struggle in its first three years.',
    readTime: '8 min read',
    date: 'April 2026',
  },
  {
    slug: 'dental-franchise-expansion-metrics',
    category: 'Franchise Strategy',
    title: '7 Metrics That Predict Dental Franchise Expansion Success',
    excerpt: 'Franchise development directors share which data points actually correlate with successful new locations. From dentist-to-resident ratios to median household income, here is what the top-performing dental groups track before signing any lease.',
    readTime: '12 min read',
    date: 'April 2026',
  },
  {
    slug: 'site-selection-software-comparison',
    category: 'Tools & Software',
    title: 'Site Selection Software Compared: Buxton vs Placer.ai vs ExpansionLens',
    excerpt: 'A side-by-side breakdown of the leading site selection platforms. Pricing, features, time-to-insight, and which tool fits independent operators versus enterprise chains.',
    readTime: '10 min read',
    date: 'March 2026',
  },
  {
    slug: 'multi-location-expansion-strategy',
    category: 'Operations',
    title: 'Multi-Location Expansion Strategy: When to Open Your Next Store',
    excerpt: 'For directors of operations managing growing brands, knowing when (and where) to open the next location is the difference between sustainable growth and overextension.',
    readTime: '11 min read',
    date: 'March 2026',
  },
  {
    slug: 'demographic-data-business-expansion',
    category: 'Market Research',
    title: 'Understanding Demographic Data for Business Expansion Decisions',
    excerpt: 'Population, median income, education levels, employment rate — what each metric actually tells you about a market. A practical guide to reading census data through the lens of expansion potential.',
    readTime: '9 min read',
    date: 'March 2026',
  },
  {
    slug: 'avoiding-bad-location-decisions',
    category: 'Risk Management',
    title: '5 Costly Location Mistakes Directors of Operations Make (And How to Avoid Them)',
    excerpt: 'A six-figure lease mistake can sink a new location before it opens. We break down the most common location selection errors operators make and how a 15-minute analysis can prevent them.',
    readTime: '7 min read',
    date: 'February 2026',
  },
];

export async function GET() {
  // Fetch published spotlights from DB
  let spotlights = [];
  try {
    spotlights = await prisma.spotlightArticle.findMany({
      where: { status: 'published' },
      select: { slug: true, city: true, state: true, score: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (e) {
    console.error('Spotlight query failed:', e.message);
  }

  const spotlightArticles = spotlights.map((s) => ({
    slug: s.slug,
    category: 'Market Spotlight',
    title: `Dental Market Analysis: ${s.city}, ${s.state}`,
    excerpt: `${s.city} scored ${s.score}/100 as a dental expansion target. See the competitive landscape, market indicators, and opportunities.`,
    readTime: '4 min read',
    date: s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026',
  }));

  // Fetch published blog posts from DB
  let blogPosts = [];
  try {
    blogPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, category: true, title: true, excerpt: true, readTime: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (e) {
    console.error('BlogPost query failed:', e.message);
  }

  const blogPostArticles = blogPosts.map((p) => ({
    slug: p.slug,
    category: p.category,
    title: p.title,
    excerpt: p.excerpt,
    readTime: p.readTime,
    date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026',
  }));

  // Static articles first, then AI blog posts, then spotlights
  const allArticles = [...staticArticles, ...blogPostArticles, ...spotlightArticles];

  // Collect unique categories
  const categories = [...new Set(allArticles.map((a) => a.category))];

  return Response.json({ articles: allArticles, categories });
}
