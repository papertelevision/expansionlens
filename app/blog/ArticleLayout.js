'use client';

export default function ArticleLayout({ category, title, date, readTime, children }) {
  return (
    <div className="blog-page">
      <header className="blog-header">
        <div className="blog-header-inner">
          <a href="/" className="blog-brand"><img src="/images/logomark.png" alt="" className="blog-logomark" />ExpansionLens</a>
          <a href="/blog" className="blog-back">&larr; All Articles</a>
        </div>
      </header>

      <main className="article-main">
        <a href="/blog" className="article-back-link">&larr; Back to Blog</a>
        <div className="article-category">{category}</div>
        <h1 className="article-title">{title}</h1>
        <div className="article-meta">
          <span>{date}</span>
          <span>&middot;</span>
          <span>{readTime}</span>
        </div>

        <div className="article-content">
          {children}
        </div>

        <div className="article-cta">
          <div className="article-cta-title">Ready to evaluate a real location?</div>
          <div className="article-cta-text">Get a complete expansion analysis with competitive intelligence, demographics, and a clear strategy &mdash; all in under 15 seconds.</div>
          <a href="/" className="article-cta-btn">Try ExpansionLens &mdash; It's Free</a>
        </div>
      </main>

      <footer className="blog-footer">
        <div className="blog-footer-inner">
          <div className="blog-footer-brand"><img src="/images/logomark.png" alt="" className="blog-footer-logomark" />ExpansionLens</div>
          <div className="blog-footer-links">
            <a href="/">Home</a>
            <a href="/blog">Blog</a>
            <a href="/sample">Sample Report</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
