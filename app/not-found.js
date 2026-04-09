export default function NotFound() {
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
        <div style={{ fontSize: '5rem', fontWeight: 800, color: '#1a2b4a', lineHeight: 1, marginBottom: '0.75rem' }}>
          404
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
          Page not found
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '400px', lineHeight: 1.6, marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.7rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to ExpansionLens
        </a>
      </div>
    </div>
  );
}
