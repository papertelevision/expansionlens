'use client';

const articles = [
  {
    slug: 'how-to-choose-dental-practice-location',
    category: 'Dental Expansion',
    title: 'How to Choose a Location for a New Dental Practice',
    excerpt: 'A data-driven framework for evaluating dental practice locations. Learn the demographic, competitive, and economic factors that determine whether a new practice will thrive or struggle in its first three years.',
    readTime: '8 min read',
    date: 'April 2026',
    keywords: 'dental practice location, dental site selection, opening a dental practice',
  },
  {
    slug: 'dental-franchise-expansion-metrics',
    category: 'Franchise Strategy',
    title: '7 Metrics That Predict Dental Franchise Expansion Success',
    excerpt: 'Franchise development directors share which data points actually correlate with successful new locations. From dentist-to-resident ratios to median household income, here is what the top-performing dental groups track before signing any lease.',
    readTime: '12 min read',
    date: 'April 2026',
    keywords: 'dental franchise expansion, franchise development, dental DSO growth',
  },
  {
    slug: 'site-selection-software-comparison',
    category: 'Tools & Software',
    title: 'Site Selection Software Compared: Buxton vs Placer.ai vs ExpansionLens',
    excerpt: 'A side-by-side breakdown of the leading site selection platforms. Pricing, features, time-to-insight, and which tool fits independent operators versus enterprise chains.',
    readTime: '10 min read',
    date: 'March 2026',
    keywords: 'site selection software, Buxton alternative, Placer.ai alternative, location intelligence tools',
  },
  {
    slug: 'multi-location-expansion-strategy',
    category: 'Operations',
    title: 'Multi-Location Expansion Strategy: When to Open Your Next Store',
    excerpt: 'For directors of operations managing growing brands, knowing when (and where) to open the next location is the difference between sustainable growth and overextension. Here is a framework for timing your expansion based on operational and market readiness.',
    readTime: '11 min read',
    date: 'March 2026',
    keywords: 'multi-location expansion, business expansion strategy, when to open new location',
  },
  {
    slug: 'demographic-data-business-expansion',
    category: 'Market Research',
    title: 'Understanding Demographic Data for Business Expansion Decisions',
    excerpt: 'Population, median income, education levels, employment rate — what each metric actually tells you about a market. A practical guide to reading census data through the lens of expansion potential.',
    readTime: '9 min read',
    date: 'March 2026',
    keywords: 'demographic data, census data for business, market research expansion',
  },
  {
    slug: 'avoiding-bad-location-decisions',
    category: 'Risk Management',
    title: '5 Costly Location Mistakes Directors of Operations Make (And How to Avoid Them)',
    excerpt: 'A six-figure lease mistake can sink a new location before it opens. We break down the most common location selection errors operators make, the warning signs they miss, and how a 15-minute analysis can prevent them.',
    readTime: '7 min read',
    date: 'February 2026',
    keywords: 'location selection mistakes, business expansion risks, due diligence',
  },
];

export default function Blog() {
  return (
    <div className="blog-page">
      <header className="blog-header">
        <div className="blog-header-inner">
          <a href="/" className="blog-brand"><img src="/images/logomark.png" alt="" className="blog-logomark" />ExpansionLens</a>
          <a href="/" className="blog-back">&larr; Back to Home</a>
        </div>
      </header>

      <main className="blog-main">
        <div className="blog-intro">
          <h1 className="blog-title">The ExpansionLens Blog</h1>
          <p className="blog-subtitle">Insights, frameworks, and data-driven guides for business expansion, site selection, and multi-location growth.</p>
        </div>

        <div className="blog-grid">
          {articles.map((article) => (
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
      </main>

      <footer className="blog-footer">
        <div className="blog-footer-inner">
          <div className="blog-footer-brand"><img src="/images/logomark.png" alt="" className="blog-footer-logomark" />ExpansionLens</div>
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
