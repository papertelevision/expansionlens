'use client';

import { useState, useEffect } from 'react';

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const url = filter === 'all' ? '/api/admin/reports' : `/api/admin/reports?industry=${filter}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => { if (data.reports) setReports(data.reports); })
      .catch(() => {});
  }, [filter]);

  if (!reports) return <div className="admin-page-loading">Loading reports...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reports</h1>
        <div className="admin-page-controls">
          <span className="admin-page-count">{reports.length} total</span>
          <select className="admin-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Industries</option>
            <option value="dental">Dental</option>
            <option value="bars">Bars & Nightlife</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Industry</th>
              <th>Score</th>
              <th>Purchased By</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="admin-td-address">{r.address}</td>
                <td><span className="admin-badge">{r.industry}</span></td>
                <td><span className={`admin-score ${r.score >= 75 ? 'excellent' : r.score >= 50 ? 'moderate' : 'poor'}`}>{r.score ?? '—'}</span></td>
                <td>{r.email}</td>
                <td className="admin-td-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td><a href={`/report?report_id=${r.id}`} className="admin-view-link">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
