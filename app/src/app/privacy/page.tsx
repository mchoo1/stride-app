import Link from 'next/link';

const EFFECTIVE_DATE = 'July 2026';
const COMPANY        = 'FIX HERO PTE. LTD. (UEN 202550423N)';
const CONTACT        = 'hello@strideapp.sg';
const DPO_NAME       = 'Dean';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function Ul({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  );
}

function TableRow({ cells, header }: { cells: string[]; header?: boolean }) {
  const Tag = header ? 'th' : 'td';
  return (
    <tr>
      {cells.map((c, i) => (
        <Tag key={i} style={{
          padding: '8px 10px', textAlign: 'left', fontSize: 13,
          fontWeight: header ? 700 : 400,
          borderBottom: '1px solid #E5E9F2',
          color: header ? '#0F1B2D' : '#5B6576',
        }}>{c}</Tag>
      ))}
    </tr>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 13, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back to sign up</Link>

        <div style={{ display: 'inline-block', marginLeft: 12, background: '#E8F5E9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#1E7F5C', verticalAlign: 'middle' }}>PDPA</div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 4px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 32 }}>
          Effective: {EFFECTIVE_DATE} · Stride is operated by {COMPANY}, Singapore.
        </p>

        <Section title="1. Who we are">
          <p>Stride (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by <strong>{COMPANY}</strong>, Singapore. This policy explains how we collect, use, and protect your personal data in line with Singapore&rsquo;s <strong>Personal Data Protection Act 2012 (PDPA)</strong>.</p>
          <p style={{ marginTop: 8 }}><strong>Data Protection Officer (DPO):</strong> {DPO_NAME} &mdash; <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C' }}>{CONTACT}</a></p>
        </Section>

        <Section title="2. What we collect">
          <p><strong>You give us:</strong></p>
          <Ul items={[
            'Account: name and email address (via Firebase Authentication).',
            'Profile: gender, age, height, current & target weight, fitness goal, activity level, dietary preferences.',
            'Activity you log: food entries, meals, water intake, weight history, workouts and activity.',
            'Feedback and meal corrections you submit to the community database.',
          ]} />
          <p style={{ marginTop: 8 }}><strong>Collected automatically:</strong></p>
          <Ul items={[
            'Approximate or precise location (GPS) — only when you enable it, to show nearby food outlets and gyms.',
            'Basic device and usage data, and cookies or local storage needed to run the app.',
          ]} />
          <p style={{ marginTop: 8 }}>We do <strong>not</strong> intentionally collect data from anyone under 18. Stride is for adults only.</p>
        </Section>

        <Section title="3. Why we use it">
          <Ul items={[
            'To create and run your account and show your personalised dashboard.',
            'To calculate calorie and macro targets and generate food recommendations.',
            'To show nearby restaurants and gyms (requires location permission).',
            'To improve the food database using community corrections.',
            'To contact you about your account or important service notices.',
          ]} />
          <p style={{ marginTop: 8 }}>We rely on your <strong>consent</strong> (given when you create an account and accept these terms) and our legitimate interests in operating and improving the service. You may withdraw consent at any time (see Section 7).</p>
        </Section>

        <Section title="4. Who we share it with">
          <p>We do <strong>not</strong> sell your personal data. We share limited data with trusted service providers who process it on our behalf:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <tbody>
              <TableRow header cells={['Provider', 'Purpose']} />
              <TableRow cells={['Google / Firebase', 'Authentication, database, and hosting']} />
              <TableRow cells={['Vercel', 'Application hosting']} />
              <TableRow cells={['Google Maps / Places', 'Nearby restaurant and gym search (receives location queries)']} />
            </tbody>
          </table>
        </Section>

        <Section title="5. Overseas transfer">
          <p>Some of our service providers — including Google/Firebase and Vercel — process data <strong>outside Singapore</strong> (primarily the United States). When we transfer your personal data overseas, we take steps to ensure it is protected to a standard comparable to the PDPA, including through the providers&rsquo; contractual data-protection commitments.</p>
          <p style={{ marginTop: 8 }}>If you have questions about overseas transfers, contact our DPO at <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C' }}>{CONTACT}</a>.</p>
        </Section>

        <Section title="6. How long we keep it">
          <p>We keep your personal data for as long as your account is active and for as long as needed for the purposes above. When you delete your account, we delete or anonymise all personal data associated with it <strong>within 30 days</strong>, unless a longer period is required by law.</p>
          <p style={{ marginTop: 8 }}>You can delete your account at any time from <strong>Profile → Settings → Delete Account</strong>. This permanently removes your account from Firebase Authentication and all associated logs, profile, and nutrition data from our Firestore database.</p>
        </Section>

        <Section title="7. Your rights (PDPA)">
          <p>You may, at any time:</p>
          <Ul items={[
            <><strong>Access</strong> — request a copy of the personal data we hold about you.</>,
            <><strong>Correct</strong> — update inaccurate or incomplete data (most of this is editable directly in the app under Profile → Settings).</>,
            <><strong>Withdraw consent and request deletion</strong> — delete your account and all associated data via Profile → Settings → Delete Account, or contact our DPO.</>,
          ]} />
          <p style={{ marginTop: 8 }}>To exercise any right, contact: <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C' }}>{CONTACT}</a>. We will respond within the timeframes required by the PDPA.</p>
        </Section>

        <Section title="8. Security">
          <p>We use industry-standard measures — encrypted connections (TLS), Firebase Authentication, and Firestore security rules — to protect your data. No system is perfectly secure, but we take reasonable steps to safeguard it and will notify you and the PDPC of any notifiable data breach as required by law.</p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>We may update this policy. We will post the new version here with a revised effective date and, for significant changes, notify you in-app.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions or requests: <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT}</a><br />
          Data Protection Officer: {DPO_NAME}, {COMPANY}, Singapore.</p>
        </Section>

        <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/terms"      style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Terms of Service</Link>
            <Link href="/disclaimer" style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Health Disclaimer</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
