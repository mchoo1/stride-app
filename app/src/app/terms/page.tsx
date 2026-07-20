import Link from 'next/link';

const EFFECTIVE_DATE = 'July 2026';
const COMPANY        = 'FIX HERO PTE. LTD. (UEN 202550423N)';
const CONTACT        = 'hello@strideapp.sg';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 13, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back to sign up</Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 4px' }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 32 }}>
          Effective: {EFFECTIVE_DATE} · {COMPANY}
        </p>

        <Section title="1. Agreement">
          <p>These Terms govern your use of the Stride web app and service (the &ldquo;Service&rdquo;), operated by <strong>{COMPANY}</strong>, Singapore. By creating an account or using the Service, you agree to these Terms and to our <Link href="/privacy" style={{ color: '#1E7F5C' }}>Privacy Policy</Link> and <Link href="/disclaimer" style={{ color: '#1E7F5C' }}>Health &amp; Nutrition Disclaimer</Link>. If you do not agree, do not use the Service.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be <strong>18 or older</strong> to use Stride. By creating an account, you confirm that you are at least 18 years of age. We may suspend or permanently delete any account we reasonably believe belongs to a person under 18.</p>
        </Section>

        <Section title="3. Your account">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 4 }}>Provide accurate information and keep your login credentials secure.</li>
            <li style={{ marginBottom: 4 }}>You are responsible for all activity that occurs under your account.</li>
            <li style={{ marginBottom: 4 }}>Notify us promptly of any unauthorised use at <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C' }}>{CONTACT}</a>.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to: misuse or disrupt the Service; attempt to access other users&rsquo; data; scrape or copy the food database for competing products; upload unlawful, offensive, or infringing content; or submit deliberately false food or nutrition data.</p>
        </Section>

        <Section title="5. User-submitted content">
          <p>If you submit content (meal data, corrections, feedback), you grant us a non-exclusive, royalty-free, worldwide licence to use, store, display, and incorporate it into the Service and food database. Do not submit anything you do not have the right to share. We may moderate, edit, or remove submissions without notice.</p>
        </Section>

        <Section title="6. Health &amp; nutrition — important">
          <p>The Service provides <strong>general information only and is not medical, dietary, or healthcare advice</strong>. Nutrition figures are <strong>estimates that may be inaccurate</strong>. You must read and accept the <Link href="/disclaimer" style={{ color: '#1E7F5C' }}>Health &amp; Nutrition Disclaimer</Link>, which forms part of these Terms. Always consult a qualified healthcare professional before making health decisions.</p>
        </Section>

        <Section title="7. Third-party services">
          <p>The Service relies on third parties including Google/Firebase, mapping services, and nutrition databases. We are not responsible for their content, accuracy, or availability. Your use of location and similar features is subject to their terms.</p>
        </Section>

        <Section title="8. Availability">
          <p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We may change, suspend, or discontinue features at any time without notice, and we do not guarantee the Service will be uninterrupted or error-free.</p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>To the fullest extent permitted by law, <strong>{COMPANY}</strong> is not liable for any indirect, incidental, or consequential loss, or for any health outcome, loss of data, or loss arising from reliance on nutrition information or targets in the Service. Where liability cannot be excluded, it is limited to the amount you paid us (if any) in the 12 months before the claim.</p>
        </Section>

        <Section title="10. Termination">
          <p>You may stop using the Service and delete your account at any time via <strong>Profile → Settings → Delete Account</strong>. This permanently deletes your account and all associated personal data. We may suspend or terminate access if you breach these Terms.</p>
        </Section>

        <Section title="11. Governing law">
          <p>These Terms are governed by the laws of <strong>Singapore</strong>. The courts of Singapore have exclusive jurisdiction over any dispute arising from or related to these Terms or the Service.</p>
        </Section>

        <Section title="12. Contact">
          <p><a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT}</a><br />{COMPANY}, Singapore.</p>
        </Section>

        <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/privacy"    style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Privacy Policy</Link>
            <Link href="/disclaimer" style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Health Disclaimer</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
