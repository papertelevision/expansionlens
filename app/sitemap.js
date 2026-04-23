import prisma from '../lib/db.js';

const BASE_URL = 'https://expansionlens.com';

export default async function sitemap() {
  // Fetch published spotlight articles from the database
  let spotlights = [];
  try {
    spotlights = await prisma.spotlightArticle.findMany({
      where: { status: 'published' },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (e) {
    // DB unavailable during build — continue with static entries only
  }

  const spotlightEntries = spotlights.map((s) => ({
    url: `${BASE_URL}/blog/${s.slug}`,
    lastModified: s.publishedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Fetch published blog posts from the database
  let blogPosts = [];
  try {
    blogPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (e) {}

  const blogPostEntries = blogPosts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    // Landing pages — lastModified updates on each deploy
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/dental`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/sample`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Blog index
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Blog articles — lastModified matches publication date
    {
      url: `${BASE_URL}/blog/how-to-choose-dental-practice-location`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/dental-franchise-expansion-metrics`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/site-selection-software-comparison`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/multi-location-expansion-strategy`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/demographic-data-business-expansion`,
      lastModified: new Date('2026-03-10'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/avoiding-bad-location-decisions`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Published spotlight articles (from database)
    ...spotlightEntries,

    // Published blog posts (from database)
    ...blogPostEntries,

    // Legal
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
