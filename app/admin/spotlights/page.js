'use client';

import { useState, useEffect } from 'react';

function getTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

function SpotlightPreview({ article, onBack, onRefresh }) {
  const [introText, setIntroText] = useState(article.introText);
  const [cityContext, setCityContext] = useState(article.cityContext || '');
  const [competitiveText, setCompetitiveText] = useState(article.competitiveText || '');
  const [summaryText, setSummaryText] = useState(article.summaryText);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

  const data = article.data;
  const score = article.score;
  const tier = getTierLabel(score);
  const radius = data.searchRadius?.radiusMiles || 3.5;
  const topUpside = (data.upside || []).slice(0, 3);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/spotlights/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ introText, cityContext, competitiveText, summaryText }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await fetch(`/api/admin/spotlights/${article.id}/publish`, { method: 'PUT' });
    setPublishing(false);
    onRefresh();
    onBack();
  };

  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!confirm(`Re-run the analysis for ${article.city}, ${article.state}? This will refresh the score and stats but keep your edited text.`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/spotlights/${article.id}/update`, { method: 'PUT' });
      const result = await res.json();
      if (result.ok) {
        const refreshed = await fetch(`/api/admin/spotlights/${article.id}`);
        const refreshedData = await refreshed.json();
        if (!refreshedData.error) {
          onRefresh();
          onBack();
        }
      }
    } catch (e) {
      alert('Update failed. Try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete spotlight for ${article.city}, ${article.state}?`)) return;
    await fetch(`/api/admin/spotlights/${article.id}`, { method: 'DELETE' });
    onRefresh();
    onBack();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="admin-login-btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          &larr; Back to List
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Delete
          </button>
          <button onClick={handlePublish} disabled={publishing} style={{ background: article.status === 'published' ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            {publishing ? '...' : article.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ background: article.status === 'published' ? '#10b981' : '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
          {article.status}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          /blog/{article.slug}
        </span>
      </div>

      <h2 style={{ margin: '0 0 1.5rem' }}>Dental Market Analysis: {article.city}, {article.state}</h2>

      {/* Editable fields */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Intro Paragraph
        </label>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Why Dentists Are Looking at {article.city}
        </label>
        <textarea
          value={cityContext}
          onChange={(e) => setCityContext(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Competitive Landscape
        </label>
        <textarea
          value={competitiveText}
          onChange={(e) => setCompetitiveText(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Is {article.city} a Good Place to Open a Dental Practice?
        </label>
        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="admin-login-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Article Preview
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Market Spotlight</div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem' }}>Dental Market Analysis: {article.city}, {article.state}</h1>

          <p style={{ lineHeight: 1.7, color: '#334155' }}>{introText}</p>

          {/* Score banner */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.5rem 2rem', margin: '1.5rem 0', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
              {score}<span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>/100</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0.25rem 0 1rem' }}>{tier}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#475569' }}>
              <div><strong>{data.competitorCount}</strong> practices nearby</div>
              <div><strong>{data.population?.toLocaleString()}</strong> residents</div>
              {data.walkScore?.walkScore && <div>Walk Score <strong>{data.walkScore.walkScore}</strong></div>}
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.75rem' }}>Why Dentists Are Looking at {article.city}</h2>
          <p style={{ lineHeight: 1.7, color: '#334155' }}>{cityContext}</p>

          <h2 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.75rem' }}>Competitive Landscape in {article.city}</h2>
          <p style={{ lineHeight: 1.7, color: '#334155' }}>{competitiveText}</p>

          {topUpside.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.75rem' }}>What Our Analysis Found</h2>
              <ul style={{ lineHeight: 1.8, color: '#334155' }}>
                {topUpside.map((u, i) => <li key={i}>{u.text}</li>)}
              </ul>
            </>
          )}

          <h2 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.75rem' }}>Is {article.city} a Good Place to Open a Dental Practice?</h2>
          <p style={{ lineHeight: 1.7, color: '#334155' }}>{summaryText}</p>

          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '12px', padding: '2rem', color: 'white', textAlign: 'center' }}>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.3rem' }}>Want to see why {article.city} scored {score}?</h2>
            <p style={{ color: '#94a3b8', margin: '0 0 1rem', fontSize: '0.9rem' }}>This spotlight is just the surface. The full report unlocks the complete analysis.</p>
            <div style={{ display: 'inline-block', background: '#10b981', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700 }}>
              Get the Full {article.city} Report &mdash; $149
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpotlightsAdmin() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);

  const fetchArticles = () => {
    fetch('/api/admin/spotlights')
      .then((r) => r.json())
      .then((data) => { if (!data.error) setArticles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!city.trim() || !state.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/spotlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state: state.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setCity('');
        setState('');
        fetchArticles();
      }
    } catch (e) {
      setError('Generation failed. Make sure the dev server is running.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/spotlights/auto-generate', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.done) {
        setError('All cities in the queue have been generated.');
      } else {
        fetchArticles();
      }
    } catch (e) {
      setError('Auto-generation failed.');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleView = async (id) => {
    const res = await fetch(`/api/admin/spotlights/${id}`);
    const data = await res.json();
    if (!data.error) setViewing(data);
  };

  if (loading) return <div className="admin-page-loading">Loading spotlights...</div>;

  if (viewing) {
    return (
      <div className="admin-page">
        <SpotlightPreview
          article={viewing}
          onBack={() => { setViewing(null); fetchArticles(); }}
          onRefresh={fetchArticles}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Market Spotlights</h1>

      <div style={{ background: 'var(--card)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Generate New Spotlight</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Austin"
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '180px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. TX"
              maxLength={2}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '60px', textTransform: 'uppercase' }}
            />
          </div>
          <button type="submit" disabled={generating} className="admin-login-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            {generating ? 'Generating (30-60s)...' : 'Generate'}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 0.25rem' }}>or</span>
          <button type="button" onClick={handleAutoGenerate} disabled={autoGenerating} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            {autoGenerating ? 'Generating (30-60s)...' : 'Generate Next from Queue'}
          </button>
        </form>
        {error && <div style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
      </div>

      {articles.length === 0 ? (
        <div className="admin-empty">No spotlight articles yet. Generate one above.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Score</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.city}, {a.state}</strong><br /><a href={`/blog/${a.slug}`} target="_blank" rel="noopener" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/blog/{a.slug}</a></td>
                  <td><span className={`admin-score ${a.score >= 75 ? 'excellent' : a.score >= 50 ? 'moderate' : 'poor'}`}>{a.score}</span></td>
                  <td>
                    <span style={{ background: a.status === 'published' ? '#10b981' : '#f59e0b', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button onClick={() => handleView(a.id)} style={{ background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
