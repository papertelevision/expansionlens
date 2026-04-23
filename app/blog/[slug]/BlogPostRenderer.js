'use client';

import ArticleLayout from '../ArticleLayout';

export default function BlogPostRenderer({ post }) {
  const pubDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'April 2026';

  return (
    <ArticleLayout
      category={post.category}
      title={post.title}
      date={pubDate}
      readTime={post.readTime}
    >
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </ArticleLayout>
  );
}
