import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 14, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 8px' }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#8B95A7', marginBottom: 28 }}>Last updated: June 2026</p>

        {[
          { title: '1. Acceptance', body: 'By creating a Stride account you agree to these Terms. If you do not agree, do not use the service.' },
          { title: '2. Service', body: 'Stride provides calorie tracking, macro logging, and food discovery tools for personal health management. It is not a medical service and does not provide medical advice.' },
          { title: '3. Your data', body: 'You own your health data. We store it securely in Firebase and never sell it to third parties. You may export or delete your data at any time from the Settings page.' },
          { title: '4. Acceptable use', body: 'You may not misuse the service, attempt unauthorised access, or use Stride for any unlawful purpose.' },
          { title: '5. Disclaimers', body: 'Stride is provided "as is." Nutritional information is sourced from official brand data and community contributions and may contain errors. Always consult a healthcare professional for medical or dietary decisions.' },
          { title: '6. Changes', body: 'We may update these Terms. Continued use after changes constitutes acceptance. We will notify users of material changes via the app.' },
          { title: '7. Contact', body: 'Questions? Email us at hello@strideapp.sg' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>{s.title}</h2>
            <p style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
