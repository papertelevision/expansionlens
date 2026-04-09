'use client';

import { useState, useEffect } from 'react';

export default function Account() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetch('/api/reports')
            .then((res) => res.json())
            .then((data) => { if (data.reports) setReports(data.reports); })
            .finally(() => setLoading(false));
        } else {
          document.location = '/';
        }
      })
      .catch(() => { document.location = '/'; });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.location = '/';
  };

  if (loading || !user) {
    return (
      <div className="account-page">
        <div className="account-loading">Loading...</div>
      </div>
    );
  }

  const totalSpent = reports.length * 149;

  return (
    <div className="account-page">
      <header className="user-header">
        <div className="user-header-inner">
          <a href="/" className="user-header-brand"><img src="/images/logomark.png" alt="" className="user-header-logo" />ExpansionLens</a>
          <div className="user-header-nav">
            <a href="/dashboard" className="user-header-link" onClick={(e) => { e.preventDefault(); document.location = '/dashboard'; }}>My Reports</a>
            <a href="/account" className="user-header-link active">Account</a>
            <button className="user-header-link" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="account-main">
        <h1 className="account-title">Account</h1>

        <div className="account-card">
          <div className="account-section">
            <div className="account-label">Email</div>
            <div className="account-value">{user.email}</div>
          </div>
          <div className="account-divider" />
          <div className="account-section">
            <div className="account-label">Member Since</div>
            <div className="account-value">{new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="account-divider" />
          <div className="account-stats-row">
            <div className="account-stat">
              <div className="account-stat-number">{reports.length}</div>
              <div className="account-stat-label">Reports Purchased</div>
            </div>
            <div className="account-stat">
              <div className="account-stat-number">${totalSpent.toLocaleString()}</div>
              <div className="account-stat-label">Total Spent</div>
            </div>
          </div>
        </div>

        <h2 className="account-subtitle">Purchase History</h2>

        {reports.length === 0 ? (
          <div className="account-empty">
            <p>No purchases yet.</p>
            <a href="/" className="account-btn">Analyze a Location</a>
          </div>
        ) : (
          <div className="account-table-wrapper">
            <table className="account-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Industry</th>
                  <th>Score</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="account-td-address">{r.address}</td>
                    <td><span className="account-badge">{r.industry}</span></td>
                    <td><span className={`account-score ${r.score >= 75 ? 'excellent' : r.score >= 50 ? 'moderate' : 'poor'}`}>{r.score ?? '—'}</span></td>
                    <td>$149</td>
                    <td className="account-td-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td><a href={`/report?report_id=${r.id}`} className="account-view-link">View</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
