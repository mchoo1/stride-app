import Link from 'next/link';

const EFFECTIVE_DATE = 'July 2026';
const VERSION        = '1.0';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 13, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back to sign up</Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 4px' }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 6 }}>
          Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version {VERSION}
        </p>
        <p style={{ fontSize: 13, color: '#8B95A7', marginBottom: 32, lineHeight: 1.6 }}>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Stride, a nutrition tracking and food
          discovery application (&quot;Stride&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). Please read them carefully before creating an account.
        </p>

        <Section title="1. Eligibility — 18+ Only">
          <p>
            Stride is intended for users who are <strong>18 years of age or older</strong>. By creating an account you
            confirm that you are at least 18 years old and have the legal capacity to enter into a binding agreement. If
            you are under 18, you must not use Stride.
          </p>
          <p style={{ marginTop: 8 }}>
            We may suspend or permanently delete any account we reasonably believe belongs to a person under 18, without
            notice.
          </p>
        </Section>

        <Section title="2. What Stride Is (and Is Not)">
          <p>
            Stride is a <strong>personal wellness and food-logging tool</strong> designed to help adults track calorie and
            macro intake, discover high-protein-per-dollar food options in Singapore, and work toward self-defined health
            goals.
          </p>
          <p style={{ marginTop: 8 }}>
            Stride is <strong>not</strong> a medical device, clinical service, or registered health professional. Nothing
            in Stride constitutes medical advice, diagnosis, or treatment.
          </p>
        </Section>

        <Section title="3. Health and Medical Disclaimer">
          <p>
            <strong>This is the most important clause for your safety.</strong> Stride&apos;s calorie targets, macro
            estimates, and food data are provided for general wellness information only. Individual nutritional needs
            vary significantly based on medical history, metabolic rate, medications, and other factors that Stride
            cannot assess.
          </p>
          <Ul items={[
            'Do not use Stride as a substitute for professional medical, dietary, or psychological advice.',
            'If you have or suspect you have an eating disorder, diabetes, cardiovascular condition, or any other medical condition, consult a qualified healthcare professional before using Stride.',
            'Calorie and macro data is sourced from official brand nutrition information, Singapore Health Promotion Board data, and community contributions. Values may contain errors or differ from your actual intake.',
            'Weight-loss goals set in Stride are estimates only. Rapid weight changes can be dangerous — consult a doctor before making significant dietary changes.',
            'If you experience distress related to food, body image, or weight while using Stride, please stop using the app and speak to a healthcare professional.',
          ]} />
        </Section>

        <Section title="4. Your Account">
          <Ul items={[
            'You are responsible for keeping your login credentials confidential.',
            'You must provide accurate information when you register. Do not impersonate another person.',
            'One person, one account. Account sharing is not permitted.',
            'You are responsible for all activity that occurs under your account.',
            'Notify us immediately at artegroupsg@gmail.com if you suspect unauthorised access.',
          ]} />
        </Section>

        <Section title="5. Your Data">
          <p>
            You own your personal data. We process it solely to provide Stride&apos;s features as described in our{' '}
            <Link href="/privacy" style={{ color: '#1E7F5C', fontWeight: 600 }}>Privacy Policy</Link>. You may
            export or delete your data at any time from Settings, or by contacting us.
          </p>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You agree not to:</p>
          <Ul items={[
            'Use Stride if you are under 18 years of age.',
            'Attempt to access another user\'s account or data.',
            'Reverse-engineer, scrape, or systematically extract data from Stride.',
            'Use Stride for any unlawful purpose under Singapore law.',
            'Submit false, misleading, or harmful content.',
            'Use Stride for commercial purposes (e.g. reselling access) without our written consent.',
          ]} />
        </Section>

        <Section title="7. Third-Party Services">
          <p>
            Stride integrates with the following third-party services to deliver its features. Your use of Stride is
            also subject to their terms:
          </p>
          <Ul items={[
            'Google Firebase — authentication and data storage (firebase.google.com/terms)',
            'Vercel — application hosting (vercel.com/legal/terms)',
            'Google Places API — restaurant and location discovery (developers.google.com/maps/terms)',
          ]} />
          <p style={{ marginTop: 8 }}>
            We are not responsible for the content, policies, or practices of these third-party services.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            Stride&apos;s interface, design, code, and brand are owned by Stride and protected under applicable intellectual
            property law. Your personal data and food logs belong to you. Restaurant nutrition data sourced from official
            brand publications remains the property of the respective brands.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            Stride is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> without warranty of
            any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or
            non-infringement. We do not guarantee that Stride will be error-free, uninterrupted, or that nutritional
            data will be accurate or complete.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the fullest extent permitted by Singapore law, Stride&apos;s total aggregate liability to you for any claim
            arising out of or in connection with these Terms or your use of Stride shall not exceed SGD 100 or the total
            fees paid by you to Stride in the 12 months preceding the claim (whichever is greater).
          </p>
          <p style={{ marginTop: 8 }}>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including
            loss of data, loss of goodwill, or personal injury arising from your use of Stride.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may stop using Stride and delete your account at any time. We may suspend or terminate your access
            without notice if you breach these Terms, including if we have reason to believe you are under 18. On
            termination, your right to use Stride ceases immediately.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via an in-app notice
            before they take effect. Your continued use of Stride after the effective date of updated Terms constitutes
            your acceptance of the changes. If you do not accept the updated Terms, you must stop using Stride.
          </p>
        </Section>

        <Section title="13. Governing Law and Dispute Resolution">
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of Singapore, without
            regard to its conflict-of-law principles. Any disputes arising out of or in connection with these Terms
            shall be subject to the non-exclusive jurisdiction of the courts of Singapore.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:artegroupsg@gmail.com" style={{ color: '#1E7F5C', fontWeight: 600 }}>
              artegroupsg@gmail.com
            </a>
            . We aim to respond within 5 business days.
          </p>
        </Section>

        <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: 20, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#C8D0DC', textAlign: 'center' }}>
            Stride · Singapore · Version {VERSION} · {EFFECTIVE_DATE}
          </p>
          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: '#8B95A7', fontWeight: 600 }}>
              View our Privacy Policy →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
