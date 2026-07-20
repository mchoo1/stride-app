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

export default function DisclaimerPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FB', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/register" style={{ fontSize: 13, color: '#8B95A7', textDecoration: 'none', fontWeight: 600 }}>← Back to sign up</Link>

        <div style={{ display: 'inline-block', marginLeft: 12, background: '#FFF3E0', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#E65100', verticalAlign: 'middle' }}>HEALTH</div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '20px 0 4px' }}>Health &amp; Nutrition Disclaimer</h1>
        <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 32 }}>
          Effective: {EFFECTIVE_DATE} · {COMPANY}
        </p>

        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: '14px 16px', marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: '#7C5C00', fontWeight: 600, margin: 0 }}>
            ⚠️ Stride is a general fitness and nutrition tracking tool. It is <strong>not a medical device</strong> and does <strong>not provide medical, dietary, or healthcare advice</strong>.
          </p>
        </div>

        <Section title="1. Not medical advice">
          <p>The calorie targets, macro recommendations, and nutrition information in Stride are for <strong>general informational and educational purposes only</strong>.</p>
          <p style={{ marginTop: 8 }}>Always consult a qualified doctor, dietitian, or other healthcare professional before starting any diet, exercise, or weight-management programme — especially if you are:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 4 }}>Pregnant or breastfeeding</li>
            <li style={{ marginBottom: 4 }}>Under 18</li>
            <li style={{ marginBottom: 4 }}>Elderly</li>
            <li style={{ marginBottom: 4 }}>Living with any medical condition including diabetes, heart conditions, eating disorders, or food allergies</li>
          </ul>
          <p style={{ marginTop: 8 }}>Never disregard professional medical advice because of something you read or calculated in Stride.</p>
        </Section>

        <Section title="2. Nutrition data is estimated">
          <p>Food and nutrition figures in Stride come from a mix of sources — official brand nutrition pages, Singapore&rsquo;s Health Promotion Board (HPB), community submissions, and other public data. As a result:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 4 }}><strong>Values are estimates and may be inaccurate or out of date.</strong> Actual calories, macros, and ingredients vary by outlet, portion size, recipe, and preparation.</li>
            <li style={{ marginBottom: 4 }}>Items shown as <strong>&ldquo;Estimated&rdquo;</strong> or <strong>&ldquo;Community&rdquo;</strong> are not verified for the specific outlet and may differ significantly from what you are actually eating.</li>
            <li style={{ marginBottom: 4 }}><strong>Allergen information, where shown, is not guaranteed.</strong> Always confirm allergens and ingredients directly with the restaurant or manufacturer. Do not rely on Stride if you have a food allergy or intolerance.</li>
          </ul>
        </Section>

        <Section title="3. Calorie &amp; macro targets">
          <p>Targets are calculated using standard formulas (e.g. Mifflin-St Jeor BMR) from the information you provide. They are <strong>generic estimates, not personalised medical or dietary prescriptions</strong>. Individual needs vary widely based on health status, medication, metabolism, and other factors not captured by Stride.</p>
        </Section>

        <Section title="4. Your responsibility">
          <p>You use Stride and any information in it at your own risk. To the fullest extent permitted by law, <strong>{COMPANY}</strong> is not liable for any loss, injury, or adverse health outcome arising from your use of, or reliance on, the app or its data.</p>
        </Section>

        <Section title="5. If you need help">
          <p>If you are experiencing a medical emergency, call <strong>995</strong> (Singapore emergency services) or go to the nearest A&amp;E.</p>
          <p style={{ marginTop: 8 }}>If you are struggling with your relationship with food or disordered eating, please reach out to a healthcare professional or a support service. Singapore helplines:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 4 }}>Samaritans of Singapore (SOS): <strong>1767</strong> (24 hr)</li>
            <li style={{ marginBottom: 4 }}>IMH Mental Health Helpline: <strong>6389 2222</strong> (24 hr)</li>
            <li style={{ marginBottom: 4 }}>National Care Hotline: <strong>1800-202-6868</strong></li>
          </ul>
        </Section>

        <Section title="6. Contact">
          <p>Questions about this disclaimer: <a href={`mailto:${CONTACT}`} style={{ color: '#1E7F5C', fontWeight: 600 }}>{CONTACT}</a></p>
        </Section>

        <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/terms"   style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Terms of Service</Link>
            <Link href="/privacy" style={{ fontSize: 13, color: '#1E7F5C', fontWeight: 600 }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
