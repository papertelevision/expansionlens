'use client';

import { useState, useEffect } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => { if (data.users) setUsers(data.users); })
      .catch(() => {});
  }, []);

  if (!users) return <div className="admin-page-loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Users</h1>
        <span className="admin-page-count">{users.length} total</span>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Reports</th>
              <th>Total Spent</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="admin-user-email">{u.email}</span>
                </td>
                <td>{u.isAdmin ? <span className="admin-badge admin-badge-admin">Admin</span> : <span className="admin-badge">User</span>}</td>
                <td>{u.reportCount}</td>
                <td>${u.totalSpent.toLocaleString()}</td>
                <td className="admin-td-date">{new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
