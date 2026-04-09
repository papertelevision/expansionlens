'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/reports', label: 'Reports', icon: '📄' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/analyze', label: 'Analyze', icon: '🔍' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const checkSession = () => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAdmin(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  };

  useEffect(() => { checkSession(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        checkSession();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (e) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (checking) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (!admin) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand">ExpansionLens</div>
          <div className="admin-login-label">Admin Login</div>
          <form onSubmit={handleLogin}>
            <input
              className="admin-login-input"
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className="admin-login-input"
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {loginError && <div className="admin-login-error">{loginError}</div>}
            <button className="admin-login-btn" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">ExpansionLens</div>
        <div className="admin-sidebar-label">Admin</div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`admin-nav-link${pathname === item.href ? ' active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-email">{admin.email}</div>
          <a href="/" className="admin-sidebar-exit">Exit Admin</a>
        </div>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
