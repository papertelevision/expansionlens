'use client';

import { useState, useEffect } from 'react';

const ARTICLES_PER_PAGE = 12;

export default function BlogIndex() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when filter changes
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);

  return (
    <div className="blog-page">
      <header className="blog-header">
        <div className="blog-header-inner">
          <a href="/" className="blog-brand"><img src="/images/logomark.png" alt="ExpansionLens logo" className="blog-logomark" />ExpansionLens</a>
          <a href="/" className="blog-back">&larr; Back to Home</a>
        </div>
      </header>

      <main className="blog-main">
        <div className="blog-intro">
          <h1 className="blog-title">The ExpansionLens Blog</h1>
          <p className="blog-subtitle">Insights, frameworks, and data-driven guides for business expansion, site selection, and multi-location growth.</p>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
            <button
              onClick={() => handleCategoryChange('All')}
              style={{
                padding: '0.4rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                background: activeCategory === 'All' ? '#0f172a' : '#e2e8f0',
                color: activeCategory === 'All' ? 'white' : '#475569',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                  background: activeCategory === cat ? '#0f172a' : '#e2e8f0',
                  color: activeCategory === cat ? 'white' : '#475569',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>Loading articles...</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>No articles in this category yet.</div>
        ) : (
          <>
            <div className="blog-grid">
              {paginated.map((article) => (
                <a key={article.slug} href={`/blog/${article.slug}`} className="blog-card">
                  <div className="blog-card-category">{article.category}</div>
                  <h2 className="blog-card-title">{article.title}</h2>
                  <p className="blog-card-excerpt">{article.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{article.date}</span>
                    <span className="blog-card-dot">&middot;</span>
                    <span>{article.readTime}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0',
                    background: 'white', cursor: page === 1 ? 'default' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, fontSize: '0.85rem',
                  }}
                >
                  &larr; Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.5rem 0.85rem', borderRadius: '6px', border: 'none',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      background: page === p ? '#0f172a' : '#f1f5f9',
                      color: page === p ? 'white' : '#475569',
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0',
                    background: 'white', cursor: page === totalPages ? 'default' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, fontSize: '0.85rem',
                  }}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="blog-footer">
        <div className="blog-footer-inner">
          <div className="blog-footer-brand"><img src="/images/logomark.png" alt="ExpansionLens logo" className="blog-footer-logomark" />ExpansionLens</div>
          <div className="blog-footer-links">
            <a href="/">Home</a>
            <a href="/#pricing">Pricing</a>
            <a href="/sample">Sample Report</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
