'use client';

import { useState, useEffect } from 'react';
import ArticleLayout from '../ArticleLayout';

function getTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

function getScoreTier(score) {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'challenging';
  return 'poor';
}

function AnimatedScore({ score, tier }) {
  const [current, setCurrent] = useState(0);
  const tierColors = { excellent: '#10b981', moderate: '#f59e0b', challenging: '#ef4444', poor: '#991b1b' };
  const color = tierColors[tier] || '#10b981';

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="score-badge-animated" style={{
      background: `conic-gradient(${color} 0% ${current}%, var(--border, #e2e8f0) ${current}% 100%)`,
    }}>
      <div className="score-badge-inner">
        <span className="score-badge-number">{current}</span>
      </div>
    </div>
  );
}

export default function SpotlightRenderer({ article, data, relatedSpotlights = [], relatedBlogPosts = [] }) {
  const { city, state, score } = article;
  const tier = getTierLabel(score);
  const scoreTier = getScoreTier(score);
  const radius = data.searchRadius?.radiusMiles || 3.5;
  const topUpside = data.upside || [];
  const analyzeUrl = `/dental?address=${encodeURIComponent(`Downtown ${city}, ${state}`)}`;

  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'April 2026';

  return (
    <ArticleLayout
      category="Market Spotlight"
      title={`Dental Market Analysis: ${city}, ${state}`}
      date={pubDate}
      readTime="4 min read"
    >
      {/* Editable intro */}
      <p>{article.introText}</p>

      {/* Score circle + tier + stat pills */}
      <div style={{
        background: '#f8fafc', borderRadius: '12px', padding: '2rem',
        margin: '1.5rem 0', border: '1px solid #e2e8f0', textAlign: 'center'
      }}>
        <AnimatedScore score={score} tier={scoreTier} />
        <div style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0.25rem 0 1.25rem' }}>{tier}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{
            background: '#e2e8f0', borderRadius: '999px', padding: '0.4rem 1rem',
            fontSize: '0.85rem', fontWeight: 600, color: '#334155'
          }}>
            {data.competitorCount} practices nearby
          </span>
          <span style={{
            background: '#e2e8f0', borderRadius: '999px', padding: '0.4rem 1rem',
            fontSize: '0.85rem', fontWeight: 600, color: '#334155'
          }}>
            {data.population?.toLocaleString()} residents
          </span>
          {data.walkScore != null && (
            <span style={{
              background: '#e2e8f0', borderRadius: '999px', padding: '0.4rem 1rem',
              fontSize: '0.85rem', fontWeight: 600, color: '#334155'
            }}>
              Walk Score {data.walkScore}
            </span>
          )}
        </div>
      </div>

      <h2>Why Dentists Are Looking at {city}</h2>
      <p>{article.cityContext}</p>

      <h2>Competitive Landscape in {city}</h2>
      <p>{article.competitiveText}</p>

      {topUpside.length > 0 && (
        <>
          <h2>What Our Analysis Found</h2>
          <ul>
            {topUpside.map((u, i) => <li key={i}>{u.text}</li>)}
          </ul>
        </>
      )}

      <h2>Is {city} a Good Place to Open a Dental Practice?</h2>
      <p>{article.summaryText}</p>

      {/* Related articles for internal linking */}
      {(relatedSpotlights.length > 0 || relatedBlogPosts.length > 0) && (
        <div style={{ margin: '2rem 0', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#334155' }}>Related Reading</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {relatedSpotlights.map((s) => (
              <a key={s.slug} href={`/blog/${s.slug}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Dental Market Analysis: {s.city}, {s.state} — scored {s.score}/100
              </a>
            ))}
            {relatedBlogPosts.map((p) => (
              <a key={p.slug} href={`/blog/${p.slug}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {p.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '12px', padding: '2.5rem', margin: '2.5rem 0',
        color: 'white', textAlign: 'center'
      }}>
        <h2 style={{ color: 'white', margin: '0 0 0.75rem', fontSize: '1.5rem' }}>
          Want to see why {city} scored {score}?
        </h2>
        <p style={{ color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
          This spotlight is just the surface. The full report unlocks:
        </p>
        <div style={{ textAlign: 'left', maxWidth: '420px', margin: '0 auto 1.5rem', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.8 }}>
          <div>&#10003; Full score breakdown across all 8 factors</div>
          <div>&#10003; Interactive competitor map with ratings and reviews</div>
          <div>&#10003; Demographic profile (income, education, growth)</div>
          <div>&#10003; NPI Registry provider landscape by specialty</div>
          <div>&#10003; Census payer mix and Medicaid tier analysis</div>
          <div>&#10003; Daytime workforce and employment data</div>
          <div>&#10003; Market capacity and revenue estimates</div>
          <div>&#10003; Personalized win strategy and action plan</div>
        </div>
        <a href={analyzeUrl} style={{
          display: 'inline-block', background: '#10b981', color: 'white',
          padding: '0.9rem 2.5rem', borderRadius: '8px', fontWeight: 700,
          fontSize: '1.05rem', textDecoration: 'none'
        }}>
          Get the Full {city} Report &mdash; $149
        </a>
        <p style={{ color: '#64748b', margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
          Instant delivery &middot; No subscription &middot; Real data from federal sources
        </p>
      </div>
    </ArticleLayout>
  );
}
