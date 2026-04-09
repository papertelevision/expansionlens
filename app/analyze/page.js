'use client';

import { useState, useEffect } from 'react';

export default function Analyze() {
  const [address, setAddress] = useState('');
  const [industry, setIndustry] = useState('dental');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else document.location = '/';
      })
      .catch(() => { document.location = '/'; })
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    document.location = `/report?address=${encodeURIComponent(address)}&industry=${encodeURIComponent(industry)}`;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.location = '/';
  };

  if (loading || !user) return null;

  return (
    <div className="analyze-page">
      <header className="user-header">
        <div className="user-header-inner">
          <a href="/" className="user-header-brand"><img src="/images/logomark.png" alt="" className="user-header-logo" />ExpansionLens</a>
          <div className="user-header-nav">
            <a href="/dashboard" className="user-header-link" onClick={(e) => { e.preventDefault(); document.location = '/dashboard'; }}>My Reports</a>
            <a href="/account" className="user-header-link" onClick={(e) => { e.preventDefault(); document.location = '/account'; }}>Account</a>
            <button className="user-header-link" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="analyze-main">
        <h1 className="analyze-title">Analyze a New Location</h1>
        <p className="analyze-subtitle">Select an industry and enter any U.S. address to generate your expansion report.<br /><strong>An expansion score will be provided free of charge.</strong></p>

        <form className="analyze-form" onSubmit={handleAnalyze}>
          <div className="analyze-form-row">
            <div className="analyze-field">
              <label className="analyze-label">Industry</label>
              <select className="analyze-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="dental">Dental Practices</option>
                <option value="bars">Bars & Nightlife</option>
              </select>
            </div>
            <div className="analyze-field analyze-field-address">
              <label className="analyze-label">Location</label>
              <input
                className="analyze-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter any U.S. address"
                autoFocus
                required
              />
            </div>
          </div>
          <button className="analyze-btn" type="submit">
            Analyze Location
          </button>
          <div className="analyze-hint">Get a free expansion score instantly &bull; Pay only when ready</div>
        </form>
      </main>
    </div>
  );
}
