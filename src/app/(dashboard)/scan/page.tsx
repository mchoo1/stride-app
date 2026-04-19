'use client';
import { useState, useRef, ChangeEvent } from 'react';
import { useStrideStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

const MOCK_SCANS = [
  { name: 'Grilled Chicken & Veg', cal: 320, protein: 38, carbs: 14, fat: 9,  conf: 91 },
  { name: 'Caesar Salad',          cal: 280, protein: 8,  carbs: 18, fat: 20, conf: 85 },
  { name: 'Pasta Bolognese',       cal: 520, protein: 24, carbs: 62, fat: 18, conf: 88 },
  { name: 'Avocado Toast',         cal: 340, protein: 9,  carbs: 32, fat: 20, conf: 93 },
  { name: 'Smoothie Bowl',         cal: 410, protein: 12, carbs: 68, fat: 10, conf: 87 },
  { name: 'Burger & Fries',        cal: 880, protein: 32, carbs: 90, fat: 44, conf: 90 },
  { name: 'Sushi Platter',         cal: 480, protein: 26, carbs: 66, fat: 10, conf: 89 },
  { name: 'Acai Bowl',             cal: 360, protein: 8,  carbs: 58, fat: 12, conf: 84 },
];

type ScanResult = typeof MOCK_SCANS[0];

export default function ScanPage() {
  const store  = useStrideStore();
  const router = useRouter();

  const [phase,   setPhase]   = useState<'idle' | 'scanning' | 'result' | 'logged'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result,  setResult]  = useState<ScanResult | null>(null);
  const [toast,   setToast]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setPhase('scanning');
    const r = MOCK_SCANS[Math.floor(Math.random() * MOCK_SCANS.length)];
    setTimeout(() => { setResult(r); setPhase('result'); }, 2200);
  };

  const logMeal = () => {
    if (!result) return;
    store.addFoodEntry({
      name: result.name, calories: result.cal,
      protein: result.protein, carbs: result.carbs, fat: result.fat,
      emoji: '📷', mealType: 'lunch' as const, foodItemId: '', quantity: 100,
    });
    setPhase('logged');
    showToast(`✅ ${result.name} logged!`);
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  const reset = () => {
    setPhase('idle'); setPreview(null); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: BG }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ color: FG1, fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: "'Anton', Impact, sans-serif", letterSpacing: '-0.3px' }}>
          SCAN FOOD
        </h1>
        <p style={{ color: FG3, fontSize: 14, margin: 0 }}>
          Snap a photo to get instant macro estimates
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        {/* Drop zone (idle) */}
        {phase === 'idle' && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '40px 20px',
                background: CARD, border: `2px dashed ${BORDER}`,
                borderRadius: 20, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'border-color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = GREEN)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              <span style={{ fontSize: 52 }}>📷</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: FG1 }}>Upload a food photo</span>
              <span style={{ fontSize: 13, color: FG3, textAlign: 'center', lineHeight: 1.5 }}>
                Click here to select a photo<br />from your device
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

            {/* Tip */}
            <div style={{
              background: 'rgba(242,169,59,0.08)', borderRadius: 14, padding: '12px 14px',
              border: '1px solid rgba(242,169,59,0.20)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
              <span style={{ fontSize: 13, color: '#8B6914', lineHeight: 1.6 }}>
                For best results, use a clear top-down photo with the food filling most of the frame.
              </span>
            </div>
          </>
        )}

        {/* Preview image */}
        {preview && phase !== 'idle' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="food" style={{
            width: '100%', height: 220, objectFit: 'cover',
            borderRadius: 18, border: `1px solid ${BORDER}`,
          }} />
        )}

        {/* Scanning spinner */}
        {phase === 'scanning' && (
          <div style={{
            background: CARD, borderRadius: 20, padding: 28,
            textAlign: 'center', border: `1px solid ${BORDER}`, boxShadow: SHADOW,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid ${BORDER}`, borderTopColor: GREEN,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: FG1 }}>Analyzing your food…</div>
            <div style={{ fontSize: 13, color: FG3, marginTop: 4 }}>
              Identifying ingredients and estimating nutrients
            </div>
          </div>
        )}

        {/* Result card */}
        {phase === 'result' && result && (
          <div style={{
            background: CARD, borderRadius: 20, padding: 18,
            border: `1px solid ${BORDER}`, boxShadow: SHADOW,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: FG1 }}>{result.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN }} />
                  <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>{result.conf}% confidence</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: FG1, lineHeight: 1, fontFamily: "'Anton', Impact, sans-serif" }}>{result.cal}</div>
                <div style={{ fontSize: 13, color: FG3 }}>kcal</div>
              </div>
            </div>

            {/* Macro boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Protein', value: `${result.protein}g`, bg: 'rgba(46,111,184,0.08)', color: '#2E6FB8' },
                { label: 'Carbs',   value: `${result.carbs}g`,  bg: 'rgba(201,138,46,0.08)', color: '#C98A2E' },
                { label: 'Fat',     value: `${result.fat}g`,    bg: 'rgba(30,127,92,0.08)',  color: GREEN     },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: FG3, textAlign: 'center', marginBottom: 14 }}>
              * Estimates based on typical serving sizes. Adjust as needed.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: CARD, border: `1.5px solid ${BORDER}`,
                color: FG2, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Try again
              </button>
              <button onClick={logMeal} style={{
                flex: 2, padding: '12px 0', borderRadius: 12,
                background: GREEN, border: 'none',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(30,127,92,0.28)',
              }}>
                + Log This Meal
              </button>
            </div>
          </div>
        )}

        {/* Logged success */}
        {phase === 'logged' && (
          <div style={{
            background: CARD, borderRadius: 20, padding: 32,
            textAlign: 'center', border: `1px solid ${BORDER}`, boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>Logged successfully!</div>
            <div style={{ fontSize: 13, color: FG3, marginTop: 6 }}>Redirecting to dashboard…</div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: FG1, color: '#fff', padding: '10px 20px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300,
          boxShadow: '0 4px 20px rgba(15,27,45,0.18)',
        }}>{toast}</div>
      )}
    </div>
  );
}
