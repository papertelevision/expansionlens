import { getAdminSession } from '../../../../lib/auth.js';
import prisma from '../../../../lib/db.js';
import { cookies } from 'next/headers';
import { generateBlogPost } from '../../../../lib/blog-generator.js';
import fs from 'fs';
import path from 'path';

const CATEGORIES = ['Dental Expansion', 'Franchise Strategy', 'Operations', 'Market Research'];

// GET /api/admin/blog-posts — list all blog posts
export async function GET() {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, slug: true, category: true, title: true,
      status: true, publishedAt: true, createdAt: true, readTime: true,
    },
  });

  return Response.json(posts);
}

// POST /api/admin/blog-posts — manually generate a blog post for a specific category
export async function POST(request) {
  const cookieStore = cookies();
  const admin = await getAdminSession(cookieStore.get('session')?.value);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const { category } = await request.json();
  if (!category || !CATEGORIES.includes(category)) {
    return Response.json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` }, { status: 400 });
  }

  // Load topic queue
  let topics;
  try {
    const topicsPath = path.join(process.cwd(), 'scripts', 'blog-topics.json');
    topics = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));
  } catch (e) {
    return Response.json({ error: 'Could not read blog-topics.json' }, { status: 500 });
  }

  const categoryTopics = topics[category] || [];

  // Find next unused topic
  const existingSlugs = new Set(
    (await prisma.blogPost.findMany({ where: { category }, select: { slug: true } }))
      .map((p) => p.slug)
  );

  const nextTopic = categoryTopics.find((t) => {
    const testSlug = t.angle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    return !existingSlugs.has(testSlug);
  });

  if (!nextTopic) {
    return Response.json({ error: `All topics for "${category}" have been used` }, { status: 409 });
  }

  // Generate via Claude API
  let result;
  try {
    result = await generateBlogPost(category, nextTopic.angle, nextTopic.keywords);
  } catch (e) {
    return Response.json({ error: `Generation failed: ${e.message}` }, { status: 500 });
  }

  // Check for slug collision
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
      status: 'draft',
    },
  });

  return Response.json({
    id: post.id, slug: post.slug, category: post.category,
    title: post.title, status: post.status,
  });
}
