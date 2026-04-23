import prisma from '../../../lib/db.js';
import { notFound } from 'next/navigation';
import SpotlightRenderer from './SpotlightRenderer';
import BlogPostRenderer from './BlogPostRenderer';

const BASE_URL = 'https://expansionlens.com';

function getTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

// Try to find a spotlight article OR a blog post for this slug
async function findContent(slug) {
  const spotlight = await prisma.spotlightArticle.findUnique({
    where: { slug, status: 'published' },
  });
  if (spotlight) return { type: 'spotlight', data: spotlight };

  const blogPost = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
  });
  if (blogPost) return { type: 'blogpost', data: blogPost };

  return null;
}

export async function generateMetadata({ params }) {
  const content = await findContent(params.slug);
  if (!content) return {};

  if (content.type === 'spotlight') {
    const { city, state, score, slug, publishedAt } = content.data;
    const tier = getTierLabel(score);
    const description = `${city} ${state} dental market scored ${score}/100 (${tier}). Competitor density, demographics, and growth analysis for dentists considering ${city}.`;
    const canonical = `${BASE_URL}/blog/${slug}`;
    const pubDate = publishedAt?.toISOString() || new Date().toISOString();

    return {
      title: `Dental Market Analysis: ${city}, ${state} | ExpansionLens`,
      description,
      alternates: { canonical },
      keywords: [`dental market ${city} ${state}`, `${city} dental practice`, `open dental practice ${city}`, `${city} dentist competition`],
      openGraph: {
        title: `Dental Market Analysis: ${city}, ${state}`,
        description, url: canonical, siteName: 'ExpansionLens', type: 'article', publishedTime: pubDate,
        images: [{ url: `${BASE_URL}/images/report-preview.jpg`, width: 1200, height: 630, alt: `ExpansionLens dental market report for ${city}, ${state}` }],
      },
      twitter: { card: 'summary_large_image', title: `Dental Market Analysis: ${city}, ${state}`, description, images: [`${BASE_URL}/images/report-preview.jpg`] },
      other: {
        'script:ld+json': JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article', headline: `Dental Market Analysis: ${city}, ${state}`,
              author: { '@type': 'Organization', name: 'ExpansionLens' },
              publisher: { '@type': 'Organization', name: 'ExpansionLens', logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logomark.png` } },
              datePublished: pubDate, dateModified: pubDate, image: `${BASE_URL}/images/report-preview.jpg`, description, mainEntityOfPage: canonical,
            },
            {
              '@type': 'FAQPage', mainEntity: [
                { '@type': 'Question', name: `Is ${city} a good place to open a dental practice?`, acceptedAnswer: { '@type': 'Answer', text: `${city}, ${state} scored ${score}/100 on the ExpansionLens Expansion Score, placing it in the ${tier.toLowerCase()} tier.` } },
                { '@type': 'Question', name: `How many dental practices are in ${city}, ${state}?`, acceptedAnswer: { '@type': 'Answer', text: `The full ExpansionLens report for ${city} maps every nearby dental practice with Google ratings, review counts, and exact locations.` } },
                { '@type': 'Question', name: `What is the dental market competition like in ${city}?`, acceptedAnswer: { '@type': 'Answer', text: `The full report includes a competitive landscape analysis with individual competitor ratings and a personalized win strategy.` } },
              ],
            },
            { '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
              { '@type': 'ListItem', position: 3, name: `Dental Market: ${city}, ${state}`, item: canonical },
            ] },
          ],
        }),
      },
    };
  }

  // Blog post metadata
  const post = content.data;
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const pubDate = post.publishedAt?.toISOString() || new Date().toISOString();
  const faqEntries = JSON.parse(post.faqEntries || '[]');

  return {
    title: `${post.title} | ExpansionLens`,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.title, description: post.excerpt, url: canonical,
      siteName: 'ExpansionLens', type: 'article', publishedTime: pubDate,
      images: [{ url: `${BASE_URL}/images/report-preview.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [`${BASE_URL}/images/report-preview.jpg`] },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article', headline: post.title,
            author: { '@type': 'Organization', name: 'ExpansionLens' },
            publisher: { '@type': 'Organization', name: 'ExpansionLens', logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logomark.png` } },
            datePublished: pubDate, dateModified: pubDate, image: `${BASE_URL}/images/report-preview.jpg`, description: post.excerpt, mainEntityOfPage: canonical,
          },
          ...(faqEntries.length > 0 ? [{
            '@type': 'FAQPage',
            mainEntity: faqEntries.map((f) => ({
              '@type': 'Question', name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }] : []),
          { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
          ] },
        ],
      }),
    },
  };
}

export default async function DynamicBlogPage({ params }) {
  const content = await findContent(params.slug);
  if (!content) notFound();

  if (content.type === 'spotlight') {
    const article = content.data;
    const data = JSON.parse(article.data);

    const relatedSpotlights = await prisma.spotlightArticle.findMany({
      where: { status: 'published', slug: { not: article.slug } },
      select: { slug: true, city: true, state: true, score: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    const relatedBlogPosts = [
      { slug: 'how-to-choose-dental-practice-location', title: 'How to Choose a Location for a New Dental Practice' },
      { slug: 'dental-franchise-expansion-metrics', title: '7 Metrics That Predict Dental Franchise Expansion Success' },
    ];

    return (
      <SpotlightRenderer
        article={{
          city: article.city, state: article.state, score: article.score, slug: article.slug,
          introText: article.introText, summaryText: article.summaryText,
          cityContext: article.cityContext || '', competitiveText: article.competitiveText || '',
          publishedAt: article.publishedAt?.toISOString(),
        }}
        data={{
          competitorCount: data.competitorCount, population: data.population,
          walkScore: data.walkScore?.walkScore ?? null, searchRadius: data.searchRadius,
          upside: (data.upside || []).slice(0, 3),
        }}
        relatedSpotlights={relatedSpotlights}
        relatedBlogPosts={relatedBlogPosts}
      />
    );
  }

  // Blog post
  const post = content.data;
  return (
    <BlogPostRenderer
      post={{
        title: post.title, category: post.category, content: post.content,
        readTime: post.readTime, slug: post.slug,
        publishedAt: post.publishedAt?.toISOString(),
      }}
    />
  );
}
