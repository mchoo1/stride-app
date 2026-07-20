'use client';

/**
 * ProviderPageClient — Task 11 (v1.1): Merchant Portal
 *
 * Route: /provider
 * Merchants apply here with their business name + UEN. After admin approval,
 * their meal-feedback submissions are marked merchant_verified and bypass the
 * general review queue.
 *
 * Firestore: merchants/{uid} — { businessName, uen, outletType, contactEmail,
 *                                 userId, status: 'pending'|'approved'|'rejected',
 *                                 createdAt }
 *
 * Integration (provider/page.tsx):
 *   Replace: import { notFound } from 'next/navigation';
 *            export default function Page() { notFound(); }
 *   With:    import dynamic from 'next/dynamic';
 *            const PageClient = dynamic(() => import('./PageClient'), { ssr: false });
 *            export default function Page() { return <PageClient />; }
 */

import { useState, useEffect } from 'react';
import Link                     from 'next/link';
import { useAuth }              from '@/lib/auth-context';
import { db }                   from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/* ── Types ───────────────────────────────────────────────────────────────────── */
type MerchantStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface MerchantDoc {
  businessName:  string;
  uen:           string;
  outletType:    string;
  contactEmail:  string;
  status:        MerchantStatus;
}

/* ── Constants ───────────────────────────────────────────────────────────────── */
const OUTLET_TYPES = [
  'Restaurant / cafe',
  'Hawker stall',
  'Food court stall',
  'Grab & go / convenience',
  'Catering',
  'Other',
];

// Singapore UEN: 9 alphanumeric chars + 1 letter check digit
const UEN_RE = /^[0-9A-Z]{9}[A-Z]$/i;

/* ── Shared styles ───────────────────────────────────────────────────────────── */
const INPUT: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
  border: '1.5px solid #E5E9F2', outline: 'none', boxSizing: 'border-box',
  color: '#0F1B2D', background: '#fff',
};

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6,
};

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function ProviderPageClient() {
  const { user, loading } = useAuth();

  const [status,       setStatus]       = useState<MerchantStatus>('none');
  const [merchantData, setMerchantData] = useState<MerchantDoc | null>(null);
  const [fetching,     setFetching]     = useState(true);

  // Form state
  const [bizName,      setBizName]      = useState('');
  const [uen,          setUen]          = useState('');
  const [outletType,   setOutletType]   = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [submitted,    setSubmitted]    = useState(false);

  /* Load existing merchant doc */
  useEffect(() => {
    if (!user || !db) { setFetching(false); return; }
    getDoc(doc(db, 'merchants', user.uid))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() as MerchantDoc;
          setStatus(data.status ?? 'pending');
          setMerchantData(data);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  async function handleApply() {
    setError('');
    if (!bizName.trim())                      { setError('Please enter your business name.');               return; }
    if (!UEN_RE.test(uen.trim()))             { setError('UEN must be 10 characters (e.g. 202012345A).');  return; }
    if (!outletType)                          { setError('Please select an outlet type.');                  return; }
    if (!/\S+@\S+\.\S+/.test(contactEmail))  { setError('Please enter a valid contact email.');           return; }
    if (!user || !db)                         { setError('You must be signed in.');                        return; }

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'merchants', user.uid), {
        businessName:  bizName.trim(),
        uen:           uen.trim().toUpperCase(),
        outletType,
        contactEmail:  contactEmail.toLowerCase().trim(),
        userId:        user.uid,
        userEmail:     user.email ?? '',
        status:        'pending',
        createdAt:     serverTimestamp(),
      });
      setSubmitted(true);
      setStatus('pending');
    } catch {
      setError('Could not submit — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading ── */
  if (loading || fetching) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8B95A7', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  /* ── Not signed in ── */
  if (!user) {
    return (
      <div style={{ padding: '48px 20px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏪</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>
          Merchant Portal
        </div>
        <p style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.6, marginBottom: 24 }}>
          Sign in to register as a verified merchant and submit menu data for your restaurant or hawker stall.
        </p>
        <Link href="/login" style={{
          display: 'inline-block', background: '#1E7F5C', color: '#fff',
          borderRadius: 12, padding: '12px 28px', fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}>
          Sign in
        </Link>
      </div>
    );
  }

  /* ── Approved ── */
  if (status === 'approved' && merchantData) {
    return (
      <div style={{ padding: '24px 20px 48px', maxWidth: 480, margin: '0 auto' }}>
        {/* Header card */}
        <div style={{
          background: 'rgba(30,127,92,0.06)', border: '1px solid rgba(30,127,92,0.18)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>✅</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1B2D' }}>
              {merchantData.businessName}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#1E7F5C',
              background: '#E8F5E9', borderRadius: 999, padding: '2px 8px',
              display: 'inline-block', marginTop: 4,
            }}>
              VERIFIED MERCHANT
            </div>
          </div>
        </div>

        {/* What you can do */}
        <div style={{ background: '#F7F8FB', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', marginBottom: 10 }}>
            What you can do
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#5B6576', lineHeight: 1.8 }}>
            <li>
              Submit or correct menu items for your outlet — corrections are published as{' '}
              <strong>Merchant Verified</strong> without waiting in the general queue.
            </li>
            <li>
              Browse to your restaurant on the{' '}
              <Link href="/eat" style={{ color: '#1E7F5C', fontWeight: 600 }}>Eat page</Link>
              {' '}and tap the feedback icon on any item.
            </li>
            <li>
              For new items, search your restaurant and use <strong>Suggest a dish</strong>.
            </li>
          </ul>
        </div>

        <div style={{ fontSize: 12, color: '#8B95A7' }}>
          Questions?{' '}
          <a href="mailto:hello@strideapp.sg" style={{ color: '#1E7F5C' }}>
            hello@strideapp.sg
          </a>
        </div>
      </div>
    );
  }

  /* ── Pending / just submitted ── */
  if (status === 'pending' || submitted) {
    return (
      <div style={{ padding: '48px 20px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>
          Application received
        </div>
        <p style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.6, margin: 0 }}>
          We&apos;ll review your application within 3–5 business days and notify you at{' '}
          <strong>{user.email}</strong>. Once approved, your corrections go live as Merchant Verified.
        </p>
        <p style={{ fontSize: 12, color: '#8B95A7', marginTop: 16 }}>
          Questions?{' '}
          <a href="mailto:hello@strideapp.sg" style={{ color: '#1E7F5C' }}>
            hello@strideapp.sg
          </a>
        </p>
      </div>
    );
  }

  /* ── Rejected ── */
  if (status === 'rejected') {
    return (
      <div style={{ padding: '48px 20px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>
          Application not approved
        </div>
        <p style={{ fontSize: 14, color: '#5B6576', lineHeight: 1.6 }}>
          We couldn&apos;t verify your business at this time. Please contact us at{' '}
          <a href="mailto:hello@strideapp.sg" style={{ color: '#1E7F5C' }}>
            hello@strideapp.sg
          </a>{' '}
          and we&apos;ll help resolve it.
        </p>
      </div>
    );
  }

  /* ── Application form ── */
  return (
    <div style={{ padding: '24px 20px 56px', maxWidth: 480, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', margin: '0 0 8px' }}>
          🏪 Merchant Portal
        </h1>
        <p style={{ fontSize: 13, color: '#5B6576', lineHeight: 1.6, margin: 0 }}>
          Register as a verified merchant to submit and update your menu data on Stride.
          Approved merchants skip the general review queue — your data goes live faster.
        </p>
      </div>

      {/* Business name */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Business / trading name *</label>
        <input
          type="text"
          placeholder="e.g. Tian Tian Chicken Rice"
          value={bizName}
          onChange={e => setBizName(e.target.value)}
          style={INPUT}
        />
      </div>

      {/* UEN */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>UEN (Unique Entity Number) *</label>
        <input
          type="text"
          placeholder="e.g. 202012345A"
          value={uen}
          onChange={e => setUen(e.target.value.toUpperCase())}
          maxLength={10}
          style={{
            ...INPUT,
            border: `1.5px solid ${uen && !UEN_RE.test(uen) ? '#DF5F3B' : '#E5E9F2'}`,
            fontFamily: 'monospace',
          }}
        />
        {uen && !UEN_RE.test(uen) && (
          <div style={{ fontSize: 11, color: '#DF5F3B', marginTop: 4 }}>
            UEN must be 10 characters (e.g. 202012345A)
          </div>
        )}
        <div style={{ fontSize: 11, color: '#8B95A7', marginTop: 4 }}>
          Find your UEN at{' '}
          <a href="https://www.bizfile.gov.sg" target="_blank" rel="noreferrer" style={{ color: '#1E7F5C' }}>
            bizfile.gov.sg
          </a>
        </div>
      </div>

      {/* Outlet type */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Outlet type *</label>
        <select
          value={outletType}
          onChange={e => setOutletType(e.target.value)}
          style={{ ...INPUT, color: outletType ? '#0F1B2D' : '#8B95A7' }}
        >
          <option value="" disabled>Select type…</option>
          {OUTLET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Contact email */}
      <div style={{ marginBottom: 24 }}>
        <label style={LABEL}>Business contact email *</label>
        <input
          type="email"
          placeholder="e.g. owner@myrestaurant.com.sg"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          style={INPUT}
        />
        <div style={{ fontSize: 11, color: '#8B95A7', marginTop: 4 }}>
          We&apos;ll use this to notify you once your application is reviewed.
        </div>
      </div>

      {/* What happens next banner */}
      <div style={{
        background: 'rgba(30,127,92,0.06)', border: '1px solid rgba(30,127,92,0.16)',
        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        fontSize: 13, color: '#2D6A52', lineHeight: 1.6,
      }}>
        <strong>After you apply:</strong> our team verifies your UEN with ACRA and contacts you
        within 3–5 business days. Once approved, corrections you submit are published as{' '}
        <em>Merchant Verified</em>, bypassing the general review queue.
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: '#DF5F3B', fontWeight: 600, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleApply}
        disabled={submitting}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: submitting ? '#8B95A7' : '#1E7F5C', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Submitting…' : 'Apply for merchant access'}
      </button>

      <p style={{ fontSize: 11, color: '#8B95A7', textAlign: 'center', margin: '12px 0 0' }}>
        By submitting, you confirm you are an authorised representative of this business
        and that the information provided is accurate.
      </p>
    </div>
  );
}
