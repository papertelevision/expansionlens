'use client';

import { useState, useEffect } from 'react';

const eventLabels = {
  landing_page_view: 'Landing Page Views',
  landing_analyze_clicked: 'Analyze Clicks (Landing)',
  landing_section_viewed: 'Section Views',
  landing_pricing_clicked: 'Pricing Clicks',
  landing_sample_clicked: 'Sample Report Clicks',
  report_generated: 'Reports Generated',
  unlock_clicked: 'Unlock Clicks',
  payment_completed: 'Payments Completed',
  page_view: 'Page Views',
};

const sourceLabels = {
  direct: 'Direct',
  google: 'Google Search',
  bing: 'Bing Search',
  yahoo: 'Yahoo Search',
  duckduckgo: 'DuckDuckGo',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
  gemini: 'Gemini',
};

function formatSource(s) {
  if (sourceLabels[s]) return sourceLabels[s];
  if (s && s.startsWith('referral:')) return s.replace('referral:', 'Referral: ');
  return s || 'Unknown';
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return <div className="admin-page-loading">Loading analytics...</div>;

  // Separate key funnel metrics from other events
  const funnelEvents = ['landing_page_view', 'landing_analyze_clicked', 'report_generated', 'unlock_clicked', 'payment_completed'];
  const funnelTotals = funnelEvents.map((e) => {
    const found = data.totals.find((t) => t.event === e);
    return { event: e, count: found?.count || 0 };
  });

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Analytics</h1>

      {/* Conversion Funnel */}
      <div className="admin-section">
        <h2 className="admin-section-title">Conversion Funnel</h2>
        <div className="admin-stats-grid" style={{ gridTemplateColumns: `repeat(${funnelEvents.length}, 1fr)` }}>
          {funnelTotals.map((t, i) => (
            <div key={t.event} className="admin-stat-card">
              <div className="admin-stat-number">{t.count}</div>
              <div className="admin-stat-label">{eventLabels[t.event] || t.event}</div>
              {i > 0 && funnelTotals[i - 1].count > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                  {Math.round((t.count / funnelTotals[i - 1].count) * 100)}% conversion
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="admin-section" style={{ marginTop: '1.5rem' }}>
        <h2 className="admin-section-title">Traffic Sources</h2>
        {(!data.sources || data.sources.length === 0) ? (
          <div className="admin-empty">No traffic data yet. Sources will appear as users visit the landing page.</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Visits</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => {
                  const total = data.sources.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <tr key={s.source}>
                      <td style={{ fontWeight: 500 }}>{formatSource(s.source)}</td>
                      <td>{s.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Event Totals */}
      <div className="admin-section" style={{ marginTop: '1.5rem' }}>
        <h2 className="admin-section-title">All Events</h2>
        <div className="admin-stats-grid">
          {data.totals.map((t) => (
            <div key={t.event} className="admin-stat-card">
              <div className="admin-stat-number">{t.count}</div>
              <div className="admin-stat-label">{eventLabels[t.event] || t.event}</div>
            </div>
          ))}
          {data.totals.length === 0 && (
            <div className="admin-stat-card">
              <div className="admin-stat-number">0</div>
              <div className="admin-stat-label">No events recorded yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="admin-section" style={{ marginTop: '1.5rem' }}>
        <h2 className="admin-section-title">Recent Events</h2>
        {data.recent.length === 0 ? (
          <div className="admin-empty">No events recorded yet.</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Source</th>
                  <th>Address</th>
                  <th>Industry</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((e) => (
                  <tr key={e.id}>
                    <td><span className="admin-badge">{e.event}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{e.source ? formatSource(e.source) : '—'}</td>
                    <td className="admin-td-address">{e.address || '—'}</td>
                    <td>{e.industry || '—'}</td>
                    <td className="admin-td-date">{new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
