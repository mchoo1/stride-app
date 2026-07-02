'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { auth } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/admin';

interface Macros {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  priceSgd: number | null;
  name?: string | null;
  confidenceTier?: string;
}

interface QueueItem {
  id: string;
  mealId: string;
  mealName: string;
  feedbackType: string;
  submitterRole: string;
  submitted: Macros;
  accuracyRating: number | null;
  comment: string | null;
  userId: string | null;
  createdAt: string | null;
  current: Macros | null;
}

const GREEN = '#1E7F5C';
const card: CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, marginBottom: 12, background: '#fff',
};
const btn = (bg: string): CSSProperties => ({
  border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
  color: '#fff', background: bg, cursor: 'pointer', marginRight: 8,
});

function macroLine(m: Macros | null): string {
  if (!m) return '—';
  const p = (n: number | null, s = '') => (n === null || n === undefined ? '·' : `${n}${s}`);
  return `${p(m.calories)} kcal · P ${p(m.proteinG)} · C ${p(m.carbsG)} · F ${p(m.fatG)} · $${p(m.priceSgd)}`;
}

export default function ModerationClient() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const token = useCallback(async (): Promise<string | null> => {
    const u = auth?.currentUser;
    return u ? u.getIdToken() : null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const t = await token();
      if (!t) { setError('Not signed in.'); return; }
      const res = await fetch('/api/admin/meal-feedback', { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 403) { setError('You are not an admin.'); return; }
      if (!res.ok) { setError(`Failed to load (${res.status}).`); return; }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError('Network error loading the queue.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const act = useCallback(async (id: string, action: 'approve' | 'reject' | 'hold', applyToMeal = false) => {
    setBusyId(id);
    try {
      const t = await token();
      if (!t) { setError('Not signed in.'); return; }
      const res = await fetch('/api/admin/meal-feedback', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: id, action, applyToMeal }),
      });
      if (!res.ok) { setError(`Action failed (${res.status}).`); return; }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      setError('Network error performing the action.');
    } finally {
      setBusyId(null);
    }
  }, [token]);

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => {
      setEmail(u?.email ?? null);
      setReady(true);
    });
    if (!auth) setReady(true);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  useEffect(() => {
    if (ready && isAdminEmail(email)) load();
  }, [ready, email, load]);

  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!isAdminEmail(email)) {
    return (
      <div style={{ padding: 24, maxWidth: 560 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Moderation</h2>
        <p style={{ color: '#6b7280' }}>This page is for admins only.{email ? ` (${email})` : ''}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Feedback review queue</h2>
        <button style={btn('#374151')} onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        {items.length} pending {items.length === 1 ? 'item' : 'items'} · signed in as {email}
      </p>

      {error && (
        <div style={{ background: '#fdecea', color: '#b42318', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>Nothing to review 🎉</div>
      )}

      {items.map((it) => {
        const isMacroOrPrice = it.feedbackType === 'macro_correction' || it.feedbackType === 'price_correction';
        return (
          <div key={it.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong>{it.mealName}</strong>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{it.feedbackType}</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 8px' }}>
              {it.submitterRole === 'merchant' ? '🏪 merchant' : `by ${it.userId?.slice(0, 6) ?? 'user'}…`}
              {it.createdAt ? ` · ${new Date(it.createdAt).toLocaleDateString()}` : ''}
            </div>

            {isMacroOrPrice && (
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div><span style={{ color: '#6b7280' }}>Current: </span>{macroLine(it.current)}</div>
                <div><span style={{ color: GREEN, fontWeight: 700 }}>Suggested: </span>{macroLine(it.submitted)}</div>
              </div>
            )}
            {it.accuracyRating != null && <div style={{ fontSize: 12 }}>Accuracy rating: {it.accuracyRating}/5</div>}
            {it.submitted.name && <div style={{ fontSize: 12 }}>Suggested name: {it.submitted.name}</div>}
            {it.comment && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#374151' }}>“{it.comment}”</div>}

            <div style={{ marginTop: 12 }}>
              {isMacroOrPrice && (
                <button style={btn(GREEN)} disabled={busyId === it.id} onClick={() => act(it.id, 'approve', true)}>
                  Approve &amp; apply
                </button>
              )}
              <button style={btn('#0e7490')} disabled={busyId === it.id} onClick={() => act(it.id, 'approve', false)}>
                Approve only
              </button>
              <button style={btn('#b45309')} disabled={busyId === it.id} onClick={() => act(it.id, 'hold')}>
                Hold
              </button>
              <button style={btn('#b42318')} disabled={busyId === it.id} onClick={() => act(it.id, 'reject')}>
                Reject
              </button>
            </div>
          </div>
        );
      })}

      <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 20 }}>
        “Approve &amp; apply” writes the suggested value onto the meal and marks it Stride-Checked
        (staff_verified) — this is how a single verified correction gets released.
      </p>
    </div>
  );
}
