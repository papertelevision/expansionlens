'use client';

import { useState, useEffect } from 'react';

function getScoreTier(score) {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'challenging';
  return 'poor';
}

function getScoreLabel(score) {
  if (score >= 75) return 'Strong Expansion Target';
  if (score >= 50) return 'Conditional Opportunity';
  return 'High Risk Location';
}

const industryLabels = {
  dental: 'Dental Practice',
  bars: 'Bar & Nightlife',
};

const industryIcons = {
  dental: '🦷',
  bars: '🍸',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // Fetch reports
          fetch('/api/reports')
            .then((res) => res.json())
            .then((data) => {
              if (data.reports) setReports(data.reports);
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.location = '/';
  };

  if (loading) {
    return (
      <div className="dash">
        <div className="dash-loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dash">
        <div className="dash-empty">
          <div className="dash-empty-title">Not signed in</div>
          <p>You need to be logged in to view your reports.</p>
          <a href="/" className="dash-btn-primary">Go to ExpansionLens</a>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <header className="user-header">
        <div className="user-header-inner">
          <a href="/" className="user-header-brand"><img src="/images/logomark.png" alt="" className="user-header-logo" />ExpansionLens</a>
          <div className="user-header-nav">
            <a href="/dashboard" className="user-header-link active">My Reports</a>
            <a href="/account" className="user-header-link" onClick={(e) => { e.preventDefault(); document.location = '/account'; }}>Account</a>
            <button className="user-header-link" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1 className="dash-page-title">Your Reports</h1>
            <p className="dash-page-subtitle">{reports.length} report{reports.length !== 1 ? 's' : ''} purchased</p>
          </div>
          <a href="/analyze" className="dash-btn-primary">New Analysis</a>
        </div>

        {reports.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">📊</div>
            <div className="dash-empty-title">No reports yet</div>
            <p>Run your first location analysis to see it here.</p>
            <a href="/analyze" className="dash-btn-primary">Analyze a Location</a>
          </div>
        ) : (
          <div className="dash-grid">
            {reports.map((report) => (
              <div key={report.id} className="dash-card">
                <div className="dash-card-top">
                  <span className="dash-card-icon">{industryIcons[report.industry] || '📍'}</span>
                  <span className="dash-card-industry">{industryLabels[report.industry] || report.industry}</span>
                </div>
                <div className="dash-card-address">{report.address}</div>
                <div className="dash-card-score-row">
                  <div className={`dash-card-score ${getScoreTier(report.score)}`}>
                    {report.score}
                  </div>
                  <div className="dash-card-score-info">
                    <div className={`dash-card-verdict ${getScoreTier(report.score)}`}>{getScoreLabel(report.score)}</div>
                    <div className="dash-card-date">{new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
                <a href={`/report?report_id=${report.id}`} className="dash-card-btn">View Full Report</a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
