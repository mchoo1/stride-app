'use client';
import { useState, useRef, ChangeEvent } from 'react';
import { useStrideStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

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

  const [phase, setPhase]         = useState<'idle' | 'scanning' | 'result' | 'logged'>('idle');
  const [preview, setPreview]     = useState<string | null>(null);
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [toast, setToast]         = useState('');
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Blue header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #4A90D9 0%, #2e78c7 100%)',
        padding: '44px 20px 16px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Scan Food</h1>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        {/* Drop zone (idle) */}
        {phase === 'idle' && (
          <>
            <div className="drop-zone" onClick={() => fileRef.current?.click()}>
              <span style={{ fontSize: 56 }}>📷</span>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#555', margin: 0 }}>Upload a food photo</h3>
              <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                Click here to select a photo<br/>from your device
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile}/>

            {/* Tip */}
            <div style={{
              background: '#FFF8E7', borderRadius: 14, padding: '12px 14px',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
              <span style={{ fontSize: 12, color: '#8B7355', lineHeight: 1.6 }}>
                For best results, use a clear top-down photo with the food filling most of the frame.
              </span>
            </div>
          </>
        )}

        {/* Preview image */}
        {preview && phase !== 'idle' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="food" style={{
            width: '100%', height: 200, objectFit: 'cover',
            borderRadius: 18, background: '#eee',
          }}/>
        )}

        {/* Scanning spinner */}
        {phase === 'scanning' && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28,
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.07)',
          }}>
            <div className="spinner" style={{ margin: '0 auto 14px' }}/>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Analyzing your food…</div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>
              Identifying ingredients and estimating nutrients
            </div>
          </div>
        )}

        {/* Result card */}
        {phase === 'result' && result && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: 18,
            boxShadow: '0 4px 16px rgba(0,0,0,.07)',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{result.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF82' }}/>
                  <span style={{ fontSize: 12, color: '#4CAF82', fontWeight: 600 }}>{result.conf}% confidence</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#FF6B6B', lineHeight: 1 }}>{result.cal}</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>kcal</div>
              </div>
            </div>

            {/* Macro boxes */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div className="macro-box macro-box-pro">
                <div className="val" style={{ fontSize: 18, fontWeight: 800 }}>{result.protein}g</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Protein</div>
              </div>
              <div className="macro-box macro-box-carb">
                <div className="val" style={{ fontSize: 18, fontWeight: 800 }}>{result.carbs}g</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Carbs</div>
              </div>
              <div className="macro-box macro-box-fat">
                <div className="val" style={{ fontSize: 18, fontWeight: 800 }}>{result.fat}g</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Fat</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginBottom: 12 }}>
              * Estimates based on typical serving sizes. Adjust as needed.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>Try again</button>
              <button onClick={logMeal} className="btn-primary" style={{ flex: 2 }}>＋ Log This Meal</button>
            </div>
          </div>
        )}

        {/* Logged success */}
        {phase === 'logged' && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28,
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.07)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF82' }}>Logged successfully!</div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 6 }}>Redirecting to dashboard…</div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300,
        }}>{toast}</div>
      )}
    </div>
  );
}
