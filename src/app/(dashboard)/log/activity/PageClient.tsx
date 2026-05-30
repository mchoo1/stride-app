'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';
import { ACTIVITY_PRESETS, estimateCaloriesBurned } from '@/lib/mockFoods';
import type { IntensityLevel } from '@/types';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

const INTENSITY_OPTS: { key: IntensityLevel; label: string; emoji: string; color: string; bg: string }[] = [
  { key: 'low',    label: 'Low',    emoji: '🟢', color: GREEN,     bg: 'rgba(30,127,92,0.10)'   },
  { key: 'medium', label: 'Medium', emoji: '🟡', color: '#C98A2E', bg: 'rgba(201,138,46,0.10)'  },
  { key: 'high',   label: 'High',   emoji: '🔴', color: '#D04E36', bg: 'rgba(208,78,54,0.10)'   },
];

const inputStyle: React.CSSProperties = {
  width: '100%', background: BG, border: `1.5px solid ${BORDER}`,
  borderRadius: 12, padding: '11px 14px', fontSize: 15, color: FG1,
  outline: 'none', fontFamily: 'inherit',
};

type Mode = 'browse' | 'ai' | 'manual';

export default function ActivityLogPage() {
  const store    = useStrideStore();
  const todayAct = store.getTodayActivityLog();
  const profile  = store.profile;
  const burned   = store.getTodayCaloriesBurned();

  const [mode, setMode]           = useState<Mode>('browse');
  const [duration, setDuration]   = useState(30);
  const [intensity, setIntensity] = useState<IntensityLevel>('medium');
  const [aiDesc, setAiDesc]       = useState('');
  const [aiResult, setAiResult]   = useState<null | { name: string; emoji: string; calories: number; met: number }>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', duration: '30', calories: '' });
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const logPreset = (preset: typeof ACTIVITY_PRESETS[0]) => {
    const cal = estimateCaloriesBurned(preset.met, duration, profile.currentWeight);
    store.addActivityEntry({
      name: preset.name, emoji: preset.emoji, durationMins: duration,
      intensity: preset.intensity, caloriesBurned: cal, source: 'manual',
    });
    showToast(`✅ ${preset.name} logged! -${cal} kcal`);
  };

  const runAiEstimate = () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true); setAiResult(null);
    setTimeout(() => {
      const desc = aiDesc.toLowerCase();
      let match = ACTIVITY_PRESETS.find(p => desc.includes(p.name.toLowerCase().split(' ')[0]));
      if (!match) {
        if      (desc.includes('run') || desc.includes('jog'))          match = ACTIVITY_PRESETS.find(p => p.name === 'Running');
        else if (desc.includes('walk'))                                  match = ACTIVITY_PRESETS.find(p => p.name === 'Brisk Walking');
        else if (desc.includes('gym') || desc.includes('weight'))       match = ACTIVITY_PRESETS.find(p => p.name === 'Weight Training');
        else if (desc.includes('swim'))                                  match = ACTIVITY_PRESETS.find(p => p.name === 'Swimming');
        else if (desc.includes('bike') || desc.includes('cycl'))        match = ACTIVITY_PRESETS.find(p => p.name === 'Cycling');
        else if (desc.includes('yoga'))                                  match = ACTIVITY_PRESETS.find(p => p.name === 'Yoga');
        else if (desc.includes('hiit') || desc.includes('circuit'))     match = ACTIVITY_PRESETS.find(p => p.name === 'HIIT');
        else if (desc.includes('danc'))                                  match = ACTIVITY_PRESETS.find(p => p.name === 'Dancing');
        else if (desc.includes('stretch'))                               match = ACTIVITY_PRESETS.find(p => p.name === 'Stretching');
        else if (desc.includes('hike') || desc.includes('trail'))       match = ACTIVITY_PRESETS.find(p => p.name === 'Hiking');
      }
      const dMatch = aiDesc.match(/(\d+)\s*(min|minute|hour|hr)/i);
      let estDur = duration;
      if (dMatch) {
        const n = parseInt(dMatch[1]);
        estDur = dMatch[2].toLowerCase().startsWith('h') ? n * 60 : n;
        setDuration(estDur);
      }
      const activity = match ?? { name: 'General Exercise', emoji: '💪', met: 4.0, intensity: 'medium' as IntensityLevel };
      const calories  = estimateCaloriesBurned(activity.met, estDur, profile.currentWeight);
      setAiResult({ name: activity.name, emoji: activity.emoji, calories, met: activity.met });
      setAiLoading(false);
    }, 1200);
  };

  const logAiResult = () => {
    if (!aiResult) return;
    store.addActivityEntry({ name: aiResult.name, emoji: aiResult.emoji, durationMins: duration,
      intensity, caloriesBurned: aiResult.calories, source: 'ai_estimate', notes: aiDesc });
    setAiDesc(''); setAiResult(null);
    showToast(`✅ ${aiResult.name} logged! -${aiResult.calories} kcal`);
  };

  const logManual = () => {
    const { name, calories } = manualForm;
    if (!name || !calories) return;
    store.addActivityEntry({ name, emoji: '🏋️', durationMins: Number(manualForm.duration) || 0,
      intensity, caloriesBurned: Number(calories), source: 'manual' });
    setManualForm({ name: '', duration: '30', calories: '' });
    showToast(`✅ ${name} logged!`);
  };

  const intensityColor = (i: IntensityLevel) =>
    i === 'high' ? '#D04E36' : i === 'medium' ? '#C98A2E' : GREEN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: BG }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ color: FG1, fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: "'Anton', Impact, sans-serif", letterSpacing: '-0.3px' }}>
          ACTIVITY LOG
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ color: FG3, fontSize: 14, margin: 0 }}>
            {burned > 0 ? `${burned} kcal burned today` : 'No activity logged yet today'}
          </p>
          {burned > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>🔥 {burned}</span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        {/* Duration + intensity */}
        <div style={{ background: CARD, borderRadius: 20, padding: '16px', border: `1px solid ${BORDER}`, boxShadow: SHADOW }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Set before logging
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: FG2, marginBottom: 6 }}>Duration (mins)</label>
              <input type="number" style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 800 }}
                value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: FG2, marginBottom: 6 }}>Intensity</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {INTENSITY_OPTS.map(opt => (
                  <button key={opt.key} onClick={() => setIntensity(opt.key)} style={{
                    flex: 1, borderRadius: 12, padding: '10px 0', textAlign: 'center', fontSize: 18,
                    cursor: 'pointer', transition: 'all .15s',
                    background: intensity === opt.key ? opt.bg : BG,
                    border: `1.5px solid ${intensity === opt.key ? opt.color : BORDER}`,
                  }}>
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'browse', l: '🏋️ Browse'     },
            { key: 'ai',     l: '🤖 AI Estimate' },
            { key: 'manual', l: '✏️ Manual'       },
          ] as { key: Mode; l: string }[]).map(t => (
            <button key={t.key} onClick={() => setMode(t.key)} style={{
              flex: 1, borderRadius: 14, padding: '10px 0', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', transition: 'all .15s', border: 'none',
              background: mode === t.key ? GREEN : CARD,
              color:      mode === t.key ? '#fff' : FG2,
              boxShadow:  mode === t.key ? '0 4px 14px rgba(30,127,92,0.25)' : SHADOW,
            }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Browse */}
        {mode === 'browse' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ACTIVITY_PRESETS.map(preset => {
              const cal = estimateCaloriesBurned(preset.met, duration, profile.currentWeight);
              const ic  = intensityColor(preset.intensity);
              return (
                <button key={preset.name} onClick={() => logPreset(preset)} style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
                  padding: '14px 12px', textAlign: 'left', cursor: 'pointer',
                  boxShadow: SHADOW, transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 28 }}>{preset.emoji}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: FG1, marginTop: 8 }}>{preset.name}</div>
                  <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>{duration} min · ~{cal} kcal</div>
                  <span style={{
                    display: 'inline-block', marginTop: 8, borderRadius: 20,
                    padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    background: preset.intensity === 'high' ? 'rgba(208,78,54,0.10)' : preset.intensity === 'medium' ? 'rgba(201,138,46,0.10)' : 'rgba(30,127,92,0.10)',
                    color: ic,
                  }}>
                    {preset.intensity}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* AI */}
        {mode === 'ai' && (
          <div style={{ background: CARD, borderRadius: 20, padding: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: FG2, marginBottom: 8 }}>
                Describe your activity
              </label>
              <textarea style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} rows={3}
                placeholder="e.g. 'Went for a 30 minute run' or 'Did 45 minutes of weight training'"
                value={aiDesc} onChange={e => setAiDesc(e.target.value)} />
            </div>
            <button onClick={runAiEstimate} disabled={!aiDesc.trim() || aiLoading} style={{
              width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
              background: !aiDesc.trim() || aiLoading ? '#E5E9F2' : GREEN,
              color: !aiDesc.trim() || aiLoading ? FG3 : '#fff',
              fontSize: 14, fontWeight: 700, cursor: aiDesc.trim() && !aiLoading ? 'pointer' : 'default',
              boxShadow: !aiDesc.trim() || aiLoading ? 'none' : '0 4px 14px rgba(30,127,92,0.25)',
              transition: 'all .15s',
            }}>
              {aiLoading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: FG2, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    Analysing…
                  </span>
                : '🤖 Estimate Calories'}
            </button>
            {aiResult && (
              <div style={{ background: 'rgba(30,127,92,0.06)', borderRadius: 16, padding: 16, border: '1px solid rgba(30,127,92,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{aiResult.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: FG1 }}>{aiResult.name}</div>
                    <div style={{ fontSize: 11, color: FG3 }}>{duration} mins · MET {aiResult.met}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, fontFamily: "'Anton', Impact, sans-serif", lineHeight: 1 }}>
                      {aiResult.calories}
                    </div>
                    <div style={{ fontSize: 10, color: FG3 }}>kcal burned</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: FG3, marginBottom: 12 }}>
                  * Estimated for {profile.currentWeight}kg body weight.
                </div>
                <button onClick={logAiResult} style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                  background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,127,92,0.25)',
                }}>
                  ✅ Log This Activity
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual */}
        {mode === 'manual' && (
          <div style={{ background: CARD, borderRadius: 20, padding: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: FG2, marginBottom: 6 }}>Activity name *</label>
              <input style={inputStyle} placeholder="e.g. Morning run"
                value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: FG2, marginBottom: 6 }}>Duration (mins)</label>
                <input type="number" style={inputStyle}
                  value={manualForm.duration} onChange={e => setManualForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: FG2, marginBottom: 6 }}>Calories burned *</label>
                <input type="number" style={inputStyle} placeholder="kcal"
                  value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))} />
              </div>
            </div>
            <button onClick={logManual} disabled={!manualForm.name || !manualForm.calories} style={{
              width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
              background: manualForm.name && manualForm.calories ? GREEN : '#E5E9F2',
              color: manualForm.name && manualForm.calories ? '#fff' : FG3,
              fontSize: 14, fontWeight: 700,
              cursor: manualForm.name && manualForm.calories ? 'pointer' : 'default',
              boxShadow: manualForm.name && manualForm.calories ? '0 4px 14px rgba(30,127,92,0.25)' : 'none',
              transition: 'all .15s',
            }}>
              Log Activity
            </button>
          </div>
        )}

        {/* Today's log */}
        {todayAct.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Today&apos;s Activity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayAct.map(entry => (
                <div key={entry.id} style={{
                  background: CARD, borderRadius: 16, padding: '12px 14px',
                  border: `1px solid ${BORDER}`, boxShadow: SHADOW,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>{entry.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: FG1 }}>{entry.name}</div>
                    <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>
                      {entry.durationMins} min ·{' '}
                      <span style={{ color: intensityColor(entry.intensity) }}>{entry.intensity}</span>
                      {entry.source === 'ai_estimate' && ' · 🤖 AI'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: GREEN }}>-{entry.caloriesBurned}</div>
                    <div style={{ fontSize: 10, color: FG3 }}>kcal</div>
                  </div>
                  <button onClick={() => store.removeActivityEntry(entry.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5,
                  }}>🗑️</button>
                </div>
              ))}
              <div style={{
                background: 'rgba(30,127,92,0.06)', borderRadius: 14, padding: '12px 16px',
                textAlign: 'center', border: '1px solid rgba(30,127,92,0.15)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>
                  Total burned today: {burned} kcal 🔥
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
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
