#!/usr/bin/env node

// Generate "Market Spotlight" blog posts by calling the analyze API for
// specific cities and formatting the results as SEO-optimized Next.js pages.
//
// Usage:
//   node scripts/generate-market-spotlight.js --city "Austin, TX"
//   node scripts/generate-market-spotlight.js --batch 3
//   node scripts/generate-market-spotlight.js --batch 3 --api-url http://localhost:3003
//
// The script:
//   1. Calls /api/analyze for the city
//   2. Generates a blog page with teaser data (score, demographics, upside/risks)
//   3. Adds a CTA to purchase the full report (preserves premium data value)
//   4. Updates the blog index and sitemap

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_URL = process.argv.includes('--api-url')
  ? process.argv[process.argv.indexOf('--api-url') + 1]
  : 'http://localhost:3003';

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(city, state) {
  return `dental-market-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${state.toLowerCase()}`;
}

function getMonthYear() {
  const d = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

function fmt(val, prefix = '', suffix = '') {
  if (val == null) return 'N/A';
  return `${prefix}${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
}

// ─── API Call ───────────────────────────────────────────────────────────────

async function analyzeCity(address) {
  const url = `${API_URL}/api/analyze?address=${encodeURIComponent(address)}&industry=dental`;
  console.log(`  Calling API: ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

// ─── Page Generation ────────────────────────────────────────────────────────

function generatePageContent(data, city, state) {
  const score = data.score;
  const tier = getTierLabel(score);
  const radius = data.searchRadius?.radiusMiles || 3.5;
  const monthYear = getMonthYear();
  const slug = slugify(city, state);
  const analyzeUrl = `/dental?address=${encodeURIComponent(`Downtown ${city}, ${state}`)}`;

  // Pick top 2-3 upside bullets only (creates curiosity without revealing everything)
  const topUpside = (data.upside || []).slice(0, 3).map((u) =>
    `          <li>${u.text}</li>`
  ).join('\n');

  // Extract first sentence of summary as a hook
  const summaryHook = (data.summary || '').split(/\.\s+/).slice(0, 2).join('. ') + '.';
  const cleanSummary = summaryHook.replace(/'/g, "&apos;").replace(/"/g, "&quot;");

  const page = `import ArticleLayout from '../ArticleLayout';

export const metadata = {
  title: 'Dental Market Analysis: ${city}, ${state} — ${monthYear} | ExpansionLens',
  description: '${city} ${state} dental market scored ${score}/100 as a dental expansion target. ${data.competitorCount} practices within ${radius} miles. See the full competitive analysis.',
  alternates: { canonical: 'https://expansionlens.com/blog/${slug}' },
  keywords: ['dental market ${city} ${state}', '${city} dental practice', '${city} ${state} dentist competition', 'open dental practice ${city}'],
};

export default function Article() {
  return (
    <ArticleLayout
      category="Market Spotlight"
      title="Dental Market Analysis: ${city}, ${state}"
      date="${monthYear}"
      readTime="2 min read"
    >
      <p>
        We analyzed downtown ${city}, ${state} as a potential dental practice
        location using U.S. Census demographics, competitor data, and
        walkability metrics. Here is a snapshot of what the data shows.
      </p>

      <h2>Expansion Score: ${score}/100 &mdash; ${tier}</h2>
      <p>
        ${city} scored <strong>${score} out of 100</strong> as a dental expansion
        target, placing it in the <strong>${tier.toLowerCase()}</strong> tier.
        This score is a weighted composite of eight factors including population
        density, household income, competition levels, walkability, and
        population growth &mdash; analyzed within a ${radius}-mile radius.
      </p>

      <h2>At a Glance</h2>
      <p>
        Our analysis identified <strong>${data.competitorCount} dental
        practices</strong> within ${radius} miles of the search point. The full
        report breaks down each competitor by name, Google rating, review
        count, and exact location on an interactive map.
      </p>

      <h2>What Stands Out</h2>
      <ul>
${topUpside}
      </ul>

      <p style={{color:'#64748b',fontStyle:'italic',margin:'1.5rem 0'}}>
        ${cleanSummary}
      </p>

      <div style={{background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',borderRadius:'12px',padding:'2.5rem',margin:'2.5rem 0',color:'white',textAlign:'center'}}>
        <h2 style={{color:'white',margin:'0 0 0.75rem',fontSize:'1.5rem'}}>Want to see why ${city} scored ${score}?</h2>
        <p style={{color:'#94a3b8',margin:'0 0 1.5rem',fontSize:'1rem',lineHeight:1.6}}>
          This spotlight is just the surface. The full report unlocks:
        </p>
        <div style={{textAlign:'left',maxWidth:'420px',margin:'0 auto 1.5rem',color:'#cbd5e1',fontSize:'0.95rem',lineHeight:1.8}}>
          <div>&#10003; Full score breakdown across all 8 factors</div>
          <div>&#10003; Interactive competitor map with ratings and reviews</div>
          <div>&#10003; Demographic profile (income, education, growth)</div>
          <div>&#10003; NPI Registry provider landscape by specialty</div>
          <div>&#10003; Census payer mix and Medicaid tier analysis</div>
          <div>&#10003; Daytime workforce and employment data</div>
          <div>&#10003; Market capacity and revenue estimates</div>
          <div>&#10003; Personalized win strategy and action plan</div>
        </div>
        <a href="${analyzeUrl}" style={{display:'inline-block',background:'#10b981',color:'white',padding:'0.9rem 2.5rem',borderRadius:'8px',fontWeight:700,fontSize:'1.05rem',textDecoration:'none'}}>
          Get the Full ${city} Report &mdash; $149
        </a>
        <p style={{color:'#64748b',margin:'0.75rem 0 0',fontSize:'0.85rem'}}>
          Instant delivery &middot; No subscription &middot; Real data from federal sources
        </p>
      </div>
    </ArticleLayout>
  );
}
`;

  return page;
}

// ─── File Writers ───────────────────────────────────────────────────────────

function writeArticlePage(slug, content) {
  const dir = path.join(ROOT, 'app', 'blog', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.js'), content, 'utf-8');
  console.log(`  Created: app/blog/${slug}/page.js`);
}

function addToBlogIndex(slug, city, state, data) {
  const blogPath = path.join(ROOT, 'app', 'blog', 'page.js');
  let src = fs.readFileSync(blogPath, 'utf-8');

  // Check if already added
  if (src.includes(`'${slug}'`)) {
    console.log(`  Blog index already has ${slug}, skipping`);
    return;
  }

  const entry = `  {
    slug: '${slug}',
    category: 'Market Spotlight',
    title: 'Dental Market Analysis: ${city}, ${state}',
    excerpt: '${city} scored ${data.score}/100 as a dental expansion target. ${data.competitorCount} existing practices, $${fmt(data.medianIncome)} median income${data.walkScore?.walkScore ? `, ${data.walkScore.walkScore} Walk Score` : ''}. See the full breakdown.',
    readTime: '3 min read',
    date: '${getMonthYear()}',
    keywords: 'dental market ${city} ${state}, ${city} dental practice location',
  },`;

  // Insert before the closing bracket of the articles array.
  // Use a function replacement to avoid $ in the entry string being
  // interpreted as regex capture group references.
  const closingIdx = src.lastIndexOf('];');
  if (closingIdx === -1) {
    console.error('  Could not find ]; in blog index');
    return;
  }
  src = src.slice(0, closingIdx) + entry + '\n' + src.slice(closingIdx);

  fs.writeFileSync(blogPath, src, 'utf-8');
  console.log(`  Updated: app/blog/page.js`);
}

function addToSitemap(slug) {
  const sitemapPath = path.join(ROOT, 'app', 'sitemap.js');
  let src = fs.readFileSync(sitemapPath, 'utf-8');

  // Check if already added
  if (src.includes(slug)) {
    console.log(`  Sitemap already has ${slug}, skipping`);
    return;
  }

  const entry = `    {
      url: \`\${BASE_URL}/blog/${slug}\`,
      lastModified: new Date('${getTodayISO()}'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },`;

  // Insert before the Legal comment section
  src = src.replace(
    /(\n    \/\/ Legal)/,
    `\n${entry}\n$1`
  );

  fs.writeFileSync(sitemapPath, src, 'utf-8');
  console.log(`  Updated: app/sitemap.js`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function processCity({ address, city, state }) {
  const slug = slugify(city, state);
  const pagePath = path.join(ROOT, 'app', 'blog', slug, 'page.js');

  if (fs.existsSync(pagePath)) {
    console.log(`  Skipping ${city}, ${state} — already exists`);
    return false;
  }

  console.log(`\nGenerating spotlight for ${city}, ${state}...`);

  const data = await analyzeCity(address);
  if (!data || data.error) {
    console.error(`  API error for ${city}: ${data?.error || 'unknown'}`);
    return false;
  }

  console.log(`  Score: ${data.score}/100, Competitors: ${data.competitorCount}`);

  const content = generatePageContent(data, city, state);
  writeArticlePage(slug, content);
  addToBlogIndex(slug, city, state, data);
  addToSitemap(slug);

  console.log(`  Done: /blog/${slug}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);

  // Single city mode: --city "Austin, TX"
  const cityIdx = args.indexOf('--city');
  if (cityIdx !== -1) {
    const cityArg = args[cityIdx + 1];
    if (!cityArg) { console.error('Usage: --city "City, ST"'); process.exit(1); }
    const [city, state] = cityArg.split(',').map((s) => s.trim());
    if (!city || !state) { console.error('Format: "City, ST"'); process.exit(1); }
    await processCity({ address: `Downtown ${city}, ${state}`, city, state });
    return;
  }

  // Batch mode: --batch N
  const batchIdx = args.indexOf('--batch');
  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1] || '3', 10) : 3;

  const citiesPath = path.join(__dirname, 'spotlight-cities.json');
  if (!fs.existsSync(citiesPath)) {
    console.error('Missing scripts/spotlight-cities.json');
    process.exit(1);
  }

  const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
  let generated = 0;

  for (const entry of cities) {
    if (generated >= batchSize) break;
    try {
      const created = await processCity(entry);
      if (created) generated++;
    } catch (e) {
      console.error(`  Failed: ${entry.city}, ${entry.state} — ${e.message}`);
    }
  }

  console.log(`\nGenerated ${generated} spotlight article(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
