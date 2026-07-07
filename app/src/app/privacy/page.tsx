import Link from 'next/link';

const EFFECTIVE_DATE  = 'July 2026';
const VERSION         = '1.0';
const CONTACT_EMAIL   = 'artegroupsg@gmail.com';

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
          color: header ? '#0F1B2D' : '#5B6576',
          borderBottom: '1px solid #E5E9F2',
          verticalAlign: 'top',
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

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 4px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 6 }}>
          Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version {VERSION}
        </p>

        {/* PDPA notice banner */}
        <div style={{
          background: 'rgba(30,127,92,0.06)', border: '1px solid rgba(30,127,92,0.18)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 32,
        }}>
          <p style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600, margin: '0 0 4px' }}>
            Singapore PDPA Notice
          </p>
          <p style={{ fontSize: 13, color: '#3D7A5F', margin: 0, lineHeight: 1.6 }}>
            This policy is prepared in compliance with Singapore&apos;s <strong>Personal Data Protection Act 2012 (PDPA)</strong>.
            As the data controller, Stride is responsible for your personal data and handles it in accordance with the
            purposes and practices described below.
          </p>
        </div>

        <Section title="1. Who We Are (Data Controller)">
          <p>
            <strong>Stride</strong> is a nutrition tracking and food discovery application for adults in Singapore.
            References to &quot;Stride&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot; refer to the Stride application and its operators.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Data Protection enquiries:</strong>{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <Section title="2. Who May Use Stride">
          <p>
            Stride is for users aged <strong>18 and above</strong> only. We do not knowingly collect personal data from
            persons under 18. If you believe a minor has created an account, contact us immediately at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1E7F5C' }}>{CONTACT_EMAIL}</a> and we will
            delete the account.
          </p>
        </Section>

        <Section title="3. Personal Data We Collect">
          <p>We collect the following categories of personal data, all of which you provide voluntarily:</p>

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Account data</p>
          <Ul items={['Full name', 'Email address', 'Password (stored as a cryptographic hash — never in plain text)']} />

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Health profile data</p>
          <Ul items={[
            'Age',
            'Biological sex (used for calorie calculation only)',
            'Height (cm)',
            'Current weight (kg)',
            'Target weight (kg)',
            'Activity level (sedentary / light / moderate / active / very active)',
            'Health goal (weight loss, muscle gain, or maintenance)',
            'Dietary preferences (e.g. Halal, Vegan, Gluten-Free)',
          ]} />

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Usage and log data</p>
          <Ul items={[
            'Food entries logged (item name, calories, protein, carbs, fat, meal type, timestamp)',
            'Activity entries logged (type, duration, calories burned, timestamp)',
            'Water intake entries',
            'App streak data',
          ]} />

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Location data</p>
          <p>
            Approximate GPS coordinates, collected only when you enable the &quot;near me&quot; restaurant feature.
            <strong> Location is used in real-time to query Google Places API and is not stored on our servers.</strong>
          </p>

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Analytics data</p>
          <p>
            Aggregated, anonymised usage events (screen views, feature taps) collected via Firebase Analytics.
            This data cannot identify you individually and is used only to improve Stride.
          </p>

          <p style={{ fontWeight: 700, color: '#0F1B2D', marginTop: 14, marginBottom: 4 }}>Consent record</p>
          <p>
            The timestamp of your acceptance of these Terms and this Privacy Policy, stored alongside your account.
          </p>
        </Section>

        <Section title="4. Health-Adjacent Personal Data">
          <p>
            Body composition data (weight, height, goal weight) and food/activity logs are <strong>health-adjacent
            personal data</strong> under the PDPA. This category attracts a higher standard of care.
          </p>
          <p style={{ marginTop: 8 }}>
            You provide this data <strong>voluntarily</strong> to access Stride&apos;s core features. By ticking the consent
            checkbox at registration, you give <strong>explicit consent</strong> to Stride collecting and processing this
            health-adjacent data for the purposes described in Section 5.
          </p>
          <p style={{ marginTop: 8 }}>
            You may withdraw consent and delete all health data at any time (see Section 10).
          </p>
        </Section>

        <Section title="5. Purposes of Collection and Use">
          <p>We collect and use your personal data <strong>only</strong> for the following purposes:</p>
          <Ul items={[
            'To create and authenticate your account',
            'To calculate your personalised daily calorie and macro targets',
            'To personalise food recommendations and restaurant suggestions',
            'To display your food logs, activity logs, streaks, and progress over time',
            'To show nearby restaurants when you enable GPS',
            'To improve Stride features using anonymised aggregate analytics',
            'To respond to data access requests and support enquiries',
          ]} />
          <p style={{ marginTop: 8 }}>
            We will not use your personal data for any other purpose — including advertising or profiling — without
            your explicit consent.
          </p>
        </Section>

        <Section title="6. Disclosure to Third Parties">
          <p>
            <strong>We do not sell, rent, or trade your personal data.</strong> We may disclose personal data to:
          </p>
          <Ul items={[
            'Our data processors (listed in Section 7) — only as necessary to provide the service',
            'Law enforcement or regulatory authorities — if required by Singapore law or a valid court order',
            'A successor entity — in the event of a merger, acquisition, or sale of assets, with prior notice to you',
          ]} />
        </Section>

        <Section title="7. Third-Party Data Processors">
          <p>We use the following sub-processors to operate Stride. Each is bound by a data processing agreement:</p>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <TableRow header cells={['Processor', 'Purpose', 'Data Shared', 'Location']} />
              </thead>
              <tbody>
                <TableRow cells={['Google Firebase (Firestore, Auth, Analytics)', 'Account storage, authentication, usage analytics', 'Account data, health profile, food & activity logs', 'USA / Global (Google Cloud)']} />
                <TableRow cells={['Vercel', 'App hosting and CDN delivery', 'Server request logs (IP, timestamp)', 'USA / Global CDN']} />
                <TableRow cells={['Google Places API', 'Nearby restaurant discovery', 'GPS coordinates (session only — not stored)', 'USA']} />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="8. Overseas Transfer of Data">
          <p>
            Your data is stored on Google Firebase infrastructure, which operates globally including servers outside
            Singapore. Google LLC maintains data transfer safeguards (including Standard Contractual Clauses) that
            provide equivalent protection to Singapore&apos;s PDPA standards. For details, see{' '}
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer"
              style={{ color: '#1E7F5C' }}>firebase.google.com/support/privacy</a>.
          </p>
        </Section>

        <Section title="9. Data Retention">
          <Ul items={[
            'Your data is retained for as long as your account is active.',
            'If you request account deletion, we will delete your personal data within 30 days, except where retention is required by applicable Singapore law.',
            'Anonymised, aggregated analytics data may be retained indefinitely as it cannot identify you.',
          ]} />
        </Section>

        <Section title="10. Your Rights under the PDPA">
          <p>Under Singapore&apos;s Personal Data Protection Act, you have the right to:</p>
          <Ul items={[
            <><strong>Access</strong> — request a copy of the personal data we hold about you.</>,
            <><strong>Correction</strong> — request that we correct any inaccurate or incomplete personal data.</>,
            <><strong>Withdrawal of consent</strong> — withdraw your consent to data collection. Note: withdrawal of core consent (account data, health profile) will require account deletion.</>,
            <><strong>Data portability</strong> — request a structured, machine-readable export of your data.</>,
            <><strong>Deletion</strong> — request that we delete your account and all associated personal data.</>,
          ]} />
          <p style={{ marginTop: 8 }}>
            To exercise any of these rights, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
            We will acknowledge your request within <strong>3 business days</strong> and fulfil it within{' '}
            <strong>10 business days</strong> (or notify you if we need more time, as permitted by the PDPA).
          </p>
        </Section>

        <Section title="11. Security">
          <p>We implement the following measures to protect your personal data:</p>
          <Ul items={[
            'Firebase Authentication — industry-standard secure sign-in; passwords are never stored in plain text',
            'Transport Layer Security (TLS/HTTPS) — all data is encrypted in transit',
            'At-rest encryption — Firebase Firestore encrypts all stored data',
            'Firestore security rules — access controls ensure you can only read and write your own data',
            'No third-party advertising SDKs with access to your personal data',
          ]} />
          <p style={{ marginTop: 8 }}>
            No system is 100% secure. If you discover a potential security vulnerability, please contact us immediately
            at{' '}<a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1E7F5C' }}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="12. Cookies and Local Storage">
          <p>
            Stride stores a Firebase Authentication session token in your browser&apos;s <code>localStorage</code> to keep
            you signed in between visits. We also cache your profile data locally for offline access. We do{' '}
            <strong>not</strong> use third-party advertising cookies or tracking pixels.
          </p>
        </Section>

        <Section title="13. Changes to This Policy">
          <p>
            We may update this Privacy Policy when our data practices change. We will notify you of material changes
            via an in-app notice at least 7 days before they take effect. Your continued use of Stride after the
            effective date constitutes acceptance of the updated Policy.
          </p>
          <p style={{ marginTop: 8 }}>
            Historical versions of this Policy are available on request.
          </p>
        </Section>

        <Section title="14. Contact and Data Protection Enquiries">
          <p>
            For any privacy questions, PDPA-related requests, or concerns about how we handle your data:
          </p>
          <div style={{ background: '#fff', border: '1px solid #E5E9F2', borderRadius: 12, padding: '16px', marginTop: 10 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0F1B2D', fontSize: 14 }}>Stride Data Protection Contact</p>
            <p style={{ margin: 0, fontSize: 14, color: '#5B6576' }}>
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT_EMAIL}</a>
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8B95A7' }}>Response time: within 3 business days</p>
          </div>
        </Section>

        <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: 20, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#C8D0DC', textAlign: 'center' }}>
            Stride · Singapore · Version {VERSION} · {EFFECTIVE_DATE}
          </p>
          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/terms" style={{ fontSize: 13, color: '#8B95A7', fontWeight: 600 }}>
              View our Terms of Service →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
