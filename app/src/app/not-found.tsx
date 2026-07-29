export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F8FB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
      }}
    >
      {/* Stride logo mark */}
      <div
        style={{
          width: 72, height: 72, borderRadius: 22,
          background: '#1E7F5C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 8px 28px rgba(30,127,92,0.30)',
        }}
      >
        <span style={{ fontSize: 36 }}>🏃</span>
      </div>

      <div
        style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 30, fontWeight: 700, color: '#0F1B2D',
          marginBottom: 10, letterSpacing: '-0.02em',
        }}
      >
        Page not found
      </div>

      <div
        style={{
          fontSize: 15, color: '#5A687A', textAlign: 'center',
          lineHeight: 1.65, maxWidth: 300, marginBottom: 36,
        }}
      >
        This page does not exist yet — but your macros do.
      </div>

      <a
        href="/dashboard"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#1E7F5C', color: '#fff',
          fontWeight: 700, fontSize: 15,
          borderRadius: 16, padding: '15px 32px',
          textDecoration: 'none',
          boxShadow: '0 4px 18px rgba(30,127,92,0.30)',
        }}
      >
        ← Back to Dashboard
      </a>
    </div>
  );
}
