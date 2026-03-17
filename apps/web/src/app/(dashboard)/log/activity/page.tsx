'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';
import { ACTIVITY_PRESETS, estimateCaloriesBurned } from '@/lib/mockFoods';
import type { IntensityLevel } from '@/types';

const INTENSITY_OPTS: { key: IntensityLevel; label: string; emoji: string; color: string }[] = [
  { key: 'low',    label: 'Low',    emoji: '🟢', color: '#00D68F' },
  { key: 'medium', label: 'Medium', emoji: '🟡', color: '#FFD166' },
  { key: 'high',   label: 'High',   emoji: '🔴', color: '#FF5A5A' },
];

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
        if (desc.includes('run') || desc.includes('jog'))          match = ACTIVITY_PRESETS.find(p => p.name === 'Running');
        else if (desc.includes('walk'))                             match = ACTIVITY_PRESETS.find(p => p.name === 'Brisk Walking');
        else if (desc.includes('gym') || desc.includes('weight'))  match = ACTIVITY_PRESETS.find(p => p.name === 'Weight Training');
        else if (desc.includes('swim'))                             match = ACTIVITY_PRESETS.find(p => p.name === 'Swimming');
        else if (desc.includes('bike') || desc.includes('cycl'))   match = ACTIVITY_PRESETS.find(p => p.name === 'Cycling');
        else if (desc.includes('yoga'))                             match = ACTIVITY_PRESETS.find(p => p.name === 'Yoga');
        else if (desc.includes('hiit') || desc.includes('circuit'))match = ACTIVITY_PRESETS.find(p => p.name === 'HIIT');
        else if (desc.includes('danc'))                             match = ACTIVITY_PRESETS.find(p => p.name === 'Dancing');
        else if (desc.includes('stretch'))                          match = ACTIVITY_PRESETS.find(p => p.name === 'Stretching');
        else if (desc.includes('hike') || desc.includes('trail'))  match = ACTIVITY_PRESETS.find(p => p.name === 'Hiking');
      }
      const dMatch = aiDesc.match(/(\d+)\s*(min|minute|hour|hr)/i);
      let estDur = duration;
      if (dMatch) { const n = parseInt(dMatch[1]); estDur = dMatch[2].toLowerCase().startsWith('h') ? n*60 : n; setDuration(estDur); }
      const activity = match ?? { name: 'General Exercise', emoji: '💪', met: 4.0, intensity: 'medium' as IntensityLevel };
      const calories = estimateCaloriesBurned(activity.met, estDur, profile.currentWeight);
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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pb-4 pt-14">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(78,155,255,.2) 0%,transparent 70%)' }}/>
        <div className="relative">
          <h1 className="text-2xl font-black" style={{ color: '#EEEEF8' }}>Activity Log 🏃</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm" style={{ color: '#8888A8' }}>
              {burned > 0 ? `${burned} kcal burned today` : 'No activity yet today'}
            </p>
            {burned > 0 && <span className="text-sm font-black" style={{ color: '#00D68F' }}>🔥 {burned}</span>}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Duration + intensity */}
        <div className="card">
          <p className="section-label mb-2">Set before logging</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#8888A8' }}>Duration (mins)</label>
              <input type="number" className="stride-input text-center text-lg font-bold" value={duration}
                onChange={e => setDuration(Number(e.target.value))}/>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#8888A8' }}>Intensity</label>
              <div className="flex gap-1.5">
                {INTENSITY_OPTS.map(opt => (
                  <button key={opt.key} onClick={() => setIntensity(opt.key)}
                    className="flex-1 rounded-xl py-2 text-center text-lg transition-all"
                    style={{
                      background: intensity === opt.key ? opt.color + '22' : '#1E1E30',
                      border: `1px solid ${intensity === opt.key ? opt.color : '#252538'}`,
                    }}>
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2">
          {([
            { key: 'browse', l: '🏋️ Browse'     },
            { key: 'ai',     l: '🤖 AI Estimate' },
            { key: 'manual', l: '✏️ Manual'       },
          ] as { key: Mode; l: string }[]).map(t => (
            <button key={t.key} onClick={() => setMode(t.key)}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
              style={{
                background: mode === t.key ? '#4E9BFF' : '#1E1E30',
                color: mode === t.key ? '#fff' : '#8888A8',
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Browse */}
        {mode === 'browse' && (
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_PRESETS.map(preset => {
              const cal = estimateCaloriesBurned(preset.met, duration, profile.currentWeight);
              return (
                <button key={preset.name} onClick={() => logPreset(preset)}
                  className="card text-left transition-all active:scale-95 hover:border-blue-400"
                  style={{ borderColor: 'transparent' }}>
                  <span className="text-2xl">{preset.emoji}</span>
                  <p className="mt-1.5 text-sm font-bold" style={{ color: '#EEEEF8' }}>{preset.name}</p>
                  <p className="text-xs" style={{ color: '#55556A' }}>{duration} min · ~{cal} kcal</p>
                  <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: preset.intensity === 'high' ? 'rgba(255,90,90,.15)' : preset.intensity === 'medium' ? 'rgba(255,209,102,.15)' : 'rgba(0,214,143,.15)',
                      color: preset.intensity === 'high' ? '#FF5A5A' : preset.intensity === 'medium' ? '#FFD166' : '#00D68F',
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
          <div className="card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#8888A8' }}>Describe your activity</label>
              <textarea className="stride-input resize-none" rows={3}
                placeholder="e.g. 'Went for a 30 minute run' or 'Did 45 minutes of weight training'"
                value={aiDesc} onChange={e => setAiDesc(e.target.value)}/>
            </div>
            <button onClick={runAiEstimate} disabled={!aiDesc.trim() || aiLoading} className="btn-primary w-full py-3">
              {aiLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin"/>
                    Analysing…
                  </span>
                : '🤖 Estimate Calories'}
            </button>
            {aiResult && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(78,155,255,.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{aiResult.emoji}</span>
                  <div>
                    <p className="font-bold" style={{ color: '#EEEEF8' }}>{aiResult.name}</p>
                    <p className="text-xs" style={{ color: '#55556A' }}>{duration} mins · MET {aiResult.met}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-black" style={{ color: '#4E9BFF' }}>{aiResult.calories}</p>
                    <p className="text-xs" style={{ color: '#55556A' }}>kcal burned</p>
                  </div>
                </div>
                <p className="mb-3 text-xs" style={{ color: '#55556A' }}>
                  * Estimated for {profile.currentWeight}kg body weight.
                </p>
                <button onClick={logAiResult} className="btn-primary w-full py-2.5 text-sm">✅ Log This Activity</button>
              </div>
            )}
          </div>
        )}

        {/* Manual */}
        {mode === 'manual' && (
          <div className="card space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#8888A8' }}>Activity name *</label>
              <input className="stride-input" placeholder="e.g. Morning run"
                value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#8888A8' }}>Duration (mins)</label>
                <input type="number" className="stride-input"
                  value={manualForm.duration} onChange={e => setManualForm(f => ({ ...f, duration: e.target.value }))}/>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#8888A8' }}>Calories burned *</label>
                <input type="number" className="stride-input" placeholder="kcal"
                  value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))}/>
              </div>
            </div>
            <button onClick={logManual} disabled={!manualForm.name || !manualForm.calories} className="btn-primary w-full py-3">
              Log Activity
            </button>
          </div>
        )}

        {/* Today's log */}
        {todayAct.length > 0 && (
          <div>
            <p className="section-label mb-2">Today's Activity</p>
            <div className="space-y-2">
              {todayAct.map(entry => (
                <div key={entry.id} className="card flex items-center gap-3">
                  <span className="text-2xl">{entry.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#EEEEF8' }}>{entry.name}</p>
                    <p className="text-xs" style={{ color: '#55556A' }}>
                      {entry.durationMins} min ·{' '}
                      <span style={{ color: entry.intensity === 'high' ? '#FF5A5A' : entry.intensity === 'medium' ? '#FFD166' : '#00D68F' }}>
                        {entry.intensity}
                      </span>
                      {entry.source === 'ai_estimate' && ' · 🤖 AI'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: '#4E9BFF' }}>-{entry.caloriesBurned}</p>
                    <p className="text-[10px]" style={{ color: '#55556A' }}>kcal</p>
                  </div>
                  <button onClick={() => store.removeActivityEntry(entry.id)} className="opacity-40 hover:opacity-100 transition ml-1 text-lg">🗑️</button>
                </div>
              ))}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(78,155,255,.1)' }}>
                <p className="text-sm font-bold" style={{ color: '#4E9BFF' }}>Total burned today: {burned} kcal 🔥</p>
              </div>
            </div>
          </div>
        )}

        <div className="bottom-nav-spacer"/>
      </div>

      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lg animate-fade-in"
          style={{ background: '#4E9BFF', color: '#fff' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
