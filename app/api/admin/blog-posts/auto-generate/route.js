import { getAdminSession } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/db.js';
import { cookies } from 'next/headers';
import { generateBlogPost } from '../../../../../lib/blog-generator.js';
import fs from 'fs';
import path from 'path';

const CATEGORIES = ['Dental Expansion', 'Franchise Strategy', 'Operations', 'Market Research'];

// POST /api/admin/blog-posts/auto-generate
// Picks the next category in the rotation, generates an article via Claude API,
// and auto-publishes. Accepts admin session or SPOTLIGHT_SECRET bearer token.
export async function POST(request) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.SPOTLIGHT_SECRET;
  const bearerValid = secret && authHeader === `Bearer ${secret}`;

  if (!admin && !bearerValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Rotate category based on total post count so each click advances
  const totalPosts = await prisma.blogPost.count();
  const categoryIndex = totalPosts % CATEGORIES.length;
  const category = CATEGORIES[categoryIndex];

  // Load topic queue
  let topics;
  try {
    const topicsPath = path.join(process.cwd(), 'scripts', 'blog-topics.json');
    topics = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));
  } catch (e) {
    return Response.json({ error: 'Could not read blog-topics.json' }, { status: 500 });
  }

  const categoryTopics = topics[category] || [];

  // Find next unused topic in this category
  const existingSlugs = new Set(
    (await prisma.blogPost.findMany({ where: { category }, select: { slug: true } }))
      .map((p) => p.slug)
  );

  const nextTopic = categoryTopics.find((t) => {
    const testSlug = t.angle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    return !existingSlugs.has(testSlug);
  });

  if (!nextTopic) {
    return Response.json({ message: `All topics for "${category}" have been used`, done: true, category });
  }

  // Generate via Claude API
  let result;
  try {
    result = await generateBlogPost(category, nextTopic.angle, nextTopic.keywords);
  } catch (e) {
    return Response.json({ error: `Generation failed: ${e.message}` }, { status: 500 });
  }

  // Handle slug collision
  const existing = await prisma.blogPost.findUnique({ where: { slug: result.slug } });
  if (existing) {
    result.slug = result.slug + '-' + Date.now().toString(36);
  }

  const post = await prisma.blogPost.create({
    data: {
      slug: result.slug,
      category,
      title: result.title,
      excerpt: result.excerpt,
      content: result.content,
      faqEntries: JSON.stringify(result.faqEntries || []),
      readTime: result.readTime || '6 min read',
      status: 'published',
      publishedAt: new Date(),
    },
  });

  return Response.json({
    ok: true,
    category: post.category,
    title: post.title,
    slug: post.slug,
    url: `/blog/${post.slug}`,
  });
}
