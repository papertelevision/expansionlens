'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => {});
  }, []);

  if (!stats) return <div className="admin-page-loading">Loading dashboard...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-number">{stats.userCount}</div>
          <div className="admin-stat-label">Total Users</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-number">{stats.reportCount}</div>
          <div className="admin-stat-label">Reports Purchased</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-number">${stats.revenue.toLocaleString()}</div>
          <div className="admin-stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Recent Purchases</h2>
        {stats.recent.length === 0 ? (
          <div className="admin-empty">No purchases yet.</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Address</th>
                  <th>Industry</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td className="admin-td-address">{r.address}</td>
                    <td><span className="admin-badge">{r.industry}</span></td>
                    <td><span className={`admin-score ${r.score >= 75 ? 'excellent' : r.score >= 50 ? 'moderate' : 'poor'}`}>{r.score ?? '—'}</span></td>
                    <td className="admin-td-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
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
