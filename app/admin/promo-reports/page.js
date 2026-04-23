'use client';

import { useState, useEffect } from 'react';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://expansionlens.com';

export default function PromoReportsAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [industry, setIndustry] = useState('dental');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const fetchReports = () => {
    fetch('/api/admin/promo-reports')
      .then((r) => r.json())
      .then((data) => { if (!data.error) setReports(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/promo-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), industry }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAddress('');
        fetchReports();
      }
    } catch (e) {
      setError('Generation failed. Make sure the dev server is running.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (id) => {
    await fetch(`/api/admin/promo-reports/${id}`, { method: 'PUT' });
    fetchReports();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo report?')) return;
    await fetch(`/api/admin/promo-reports/${id}`, { method: 'DELETE' });
    fetchReports();
  };

  const handleCopy = (slug) => {
    const url = `${BASE_URL}/report?promo=${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="admin-page-loading">Loading promo reports...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Promo Reports</h1>

      <div style={{ background: 'var(--card)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Generate New Promo Report</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Denver, CO"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            >
              <option value="dental">Dental</option>
              <option value="bars">Bars & Nightlife</option>
            </select>
          </div>
          <button type="submit" disabled={generating} className="admin-login-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            {generating ? 'Generating (30-60s)...' : 'Generate'}
          </button>
        </form>
        {error && <div style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
      </div>

      {reports.length === 0 ? (
        <div className="admin-empty">No promo reports yet. Generate one above.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Score</th>
                <th>Visibility</th>
                <th>Link</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.address}</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.industry}</span>
                  </td>
                  <td>
                    <span className={`admin-score ${r.score >= 75 ? 'excellent' : r.score >= 50 ? 'moderate' : 'poor'}`}>{r.score}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(r.id)}
                      style={{
                        background: r.isPublic ? '#10b981' : '#64748b',
                        color: 'white', border: 'none', padding: '0.3rem 0.75rem',
                        borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem',
                        fontWeight: 600, minWidth: '70px',
                      }}
                    >
                      {r.isPublic ? 'Public' : 'Private'}
                    </button>
                  </td>
                  <td>
                    {r.isPublic ? (
                      <button
                        onClick={() => handleCopy(r.slug)}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                          fontSize: '0.8rem', color: copied === r.slug ? '#10b981' : 'inherit',
                        }}
                      >
                        {copied === r.slug ? 'Copied!' : 'Copy Link'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set to public first</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={`/report?promo=${r.slug}`}
                        target="_blank"
                        rel="noopener"
                        style={{ background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', textDecoration: 'none', color: 'inherit' }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ background: 'none', border: '1px solid #ef4444', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
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
