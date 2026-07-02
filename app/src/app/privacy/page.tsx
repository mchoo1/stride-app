import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 14, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#8B95A7', marginBottom: 28 }}>Last updated: June 2026</p>

        {[
          { title: '1. What we collect', body: 'We collect the information you provide when you register (name, email, body stats, goal) and the data you log in the app (food, activity, weight, water). We also collect basic usage analytics to improve the product.' },
          { title: '2. How we use it', body: 'Your data is used solely to provide personalised calorie targets, food recommendations, and streak tracking within Stride. We do not use your health data for advertising.' },
          { title: '3. Data storage', body: 'Your data is stored in Google Firebase (Firestore), hosted in Singapore/Asia-Pacific. Firebase is certified to ISO 27001 and SOC 2/3.' },
          { title: '4. Sharing', body: 'We do not sell or share your personal data with third parties. Aggregated, anonymised data may be used for product improvement. We use Google Places API for restaurant discovery — your location is used only during the session and not stored.' },
          { title: '5. Your rights', body: 'You can view, export, or delete all your data at any time from Settings → Reset App. To permanently delete your account and all associated data, contact us at hello@strideapp.sg.' },
          { title: '6. Cookies', body: 'We use Firebase Authentication tokens stored in localStorage to keep you signed in. No third-party advertising cookies are used.' },
          { title: '7. Children', body: 'Stride is intended for users 13 and older. We do not knowingly collect data from children under 13.' },
          { title: '8. Contact', body: 'Privacy questions? Email hello@strideapp.sg' },
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
