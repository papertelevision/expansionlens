'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>
          ExpansionLens
        </div>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '400px', lineHeight: 1.6, marginBottom: '2rem' }}>
          We encountered an unexpected error. Please try again or return to the home page.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#1a2b4a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.7rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
