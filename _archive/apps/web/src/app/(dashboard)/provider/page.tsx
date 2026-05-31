'use client';
import { useState } from 'react';

const TABS = ['Overview', 'Menu', 'Classes', 'Analytics'];

const MENU_ITEMS = [
  { id: 'mi1', name: 'Grilled Chicken Salad', cal: 420, p: 42, c: 24, f: 16, price: 14.90, status: 'live', orders: 134 },
  { id: 'mi2', name: 'Salmon Rice Bowl', cal: 510, p: 38, c: 52, f: 14, price: 18.50, status: 'live', orders: 98 },
  { id: 'mi3', name: 'Quinoa Power Bowl', cal: 390, p: 22, c: 48, f: 10, price: 13.90, status: 'draft', orders: 0 },
];

const CLASSES = [
  { id: 'c1', name: 'Morning HIIT', instructor: 'Sarah K.', day: 'Mon/Wed/Fri', time: '7:00 AM', spots: 12, filled: 9, cal: 420 },
  { id: 'c2', name: 'Power Yoga', instructor: 'Priya M.', day: 'Tue/Thu', time: '6:30 PM', spots: 15, filled: 11, cal: 250 },
  { id: 'c3', name: 'Spin Class', instructor: 'Jordan T.', day: 'Daily', time: '12:00 PM', spots: 20, filled: 6, cal: 550 },
];

export default function ProviderPage() {
  const [tab, setTab] = useState('Overview');
  const [addingItem, setAddingItem] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pb-4 pt-14">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(78,155,255,.2) 0%,transparent 70%)' }}/>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'rgba(78,155,255,.2)' }}>🏢</div>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#4E9BFF' }}>Partner Portal</p>
              <h1 className="text-xl font-black" style={{ color: '#EEEEF8' }}>SaladStop! — Orchard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: 'rgba(0,214,143,.15)', color: '#00D68F' }}>✓ Verified Partner</span>
            <span className="text-xs" style={{ color: '#55556A' }}>Restaurant · Healthy</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pill-tab ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-4">
        {/* Overview */}
        {tab === 'Overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Profile Views', val: '2,840', sub: 'This week', col: '#4E9BFF', icon: '👁️' },
                { label: 'Macro Logs', val: '1,204', sub: 'From your menu', col: '#00D68F', icon: '📊' },
                { label: 'Meal Clicks', val: '486', sub: 'Recommendation taps', col: '#FFD166', icon: '🍜' },
                { label: 'Avg Match Score', val: '87%', sub: 'User macro fit', col: '#9D7BFF', icon: '🎯' },
              ].map(s => (
                <div key={s.label} className="card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[10px]" style={{ color: '#55556A' }}>{s.sub}</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: s.col }}>{s.val}</p>
                  <p className="text-xs" style={{ color: '#8888A8' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Promotions */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: '#EEEEF8' }}>Active Promotions</p>
                <button className="text-xs font-bold" style={{ color: '#4E9BFF' }}>+ Add</button>
              </div>
              <div className="rounded-xl px-3 py-2 flex items-center gap-3"
                style={{ background: 'rgba(0,214,143,.08)', border: '1px solid rgba(0,214,143,.2)' }}>
                <span className="text-2xl">🎉</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#EEEEF8' }}>Lunch Special — 15% off</p>
                  <p className="text-xs" style={{ color: '#55556A' }}>Weekdays 11am–2pm · Ends Dec 31</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(0,214,143,.2)', color: '#00D68F' }}>Live</span>
              </div>
            </div>

            {/* Wearable/delivery integrations */}
            <div className="card">
              <p className="text-sm font-bold mb-3" style={{ color: '#EEEEF8' }}>Delivery App Links</p>
              <div className="space-y-2">
                {[
                  { name: 'GrabFood', status: 'Connected', col: '#00D68F' },
                  { name: 'Deliveroo', status: 'Connected', col: '#00CCBC' },
                  { name: 'Uber Eats', status: 'Not linked', col: '#55556A' },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: '#1E1E30' }}>
                    <span className="text-sm font-semibold" style={{ color: '#EEEEF8' }}>{d.name}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: d.status === 'Not linked' ? '#1E1E30' : d.col + '22', color: d.col,
                               border: d.status === 'Not linked' ? '1px solid #252538' : 'none' }}>
                      {d.status === 'Not linked' ? '+ Connect' : '✓ ' + d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Menu */}
        {tab === 'Menu' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: '#EEEEF8' }}>{MENU_ITEMS.length} items</p>
              <button onClick={() => setAddingItem(!addingItem)} className="btn-primary py-2 px-4 text-xs">
                + Add Item
              </button>
            </div>

            {addingItem && (
              <div className="card" style={{ borderColor: '#4E9BFF' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#4E9BFF' }}>New Menu Item</p>
                <div className="space-y-2">
                  <input className="stride-input text-sm" placeholder="Dish name"/>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="stride-input text-sm" placeholder="Price ($)"/>
                    <input className="stride-input text-sm" placeholder="Calories (kcal)"/>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input className="stride-input text-sm" placeholder="Protein (g)"/>
                    <input className="stride-input text-sm" placeholder="Carbs (g)"/>
                    <input className="stride-input text-sm" placeholder="Fat (g)"/>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 py-2 text-xs">Save</button>
                    <button onClick={() => setAddingItem(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {MENU_ITEMS.map(item => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#EEEEF8' }}>{item.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#FFD166' }}>${item.price.toFixed(2)}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: item.status === 'live' ? 'rgba(0,214,143,.15)' : 'rgba(255,209,102,.15)',
                        color: item.status === 'live' ? '#00D68F' : '#FFD166',
                      }}>
                      {item.status === 'live' ? '● Live' : '○ Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-black" style={{ color: '#FF5A5A' }}>{item.cal} kcal</span>
                  <span className="text-[10px]" style={{ color: '#55556A' }}>P:{item.p}g · C:{item.c}g · F:{item.f}g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#55556A' }}>📊 {item.orders} macro logs from users</span>
                  <button className="text-xs font-semibold" style={{ color: '#4E9BFF' }}>Edit</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Classes */}
        {tab === 'Classes' && (
          <>
            <button className="btn-primary w-full py-2.5 text-sm">+ Add Class Schedule</button>
            {CLASSES.map(cls => (
              <div key={cls.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#EEEEF8' }}>{cls.name}</p>
                  <span className="text-xs font-semibold" style={{ color: '#8888A8' }}>🔥 {cls.cal} kcal est.</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[11px]" style={{ color: '#55556A' }}>👤 {cls.instructor}</span>
                  <span style={{ color: '#252538' }}>·</span>
                  <span className="text-[11px]" style={{ color: '#55556A' }}>📅 {cls.day}</span>
                  <span style={{ color: '#252538' }}>·</span>
                  <span className="text-[11px]" style={{ color: '#55556A' }}>⏰ {cls.time}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px]" style={{ color: '#55556A' }}>{cls.filled}/{cls.spots} booked</span>
                    <span className="text-[10px]" style={{ color: cls.filled >= cls.spots * 0.8 ? '#FF5A5A' : '#00D68F' }}>
                      {cls.spots - cls.filled} spots left
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(cls.filled / cls.spots) * 100}%`, background: '#4E9BFF' }}/>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Analytics */}
        {tab === 'Analytics' && (
          <>
            <div className="card">
              <p className="text-sm font-bold mb-3" style={{ color: '#EEEEF8' }}>Top Performing Dishes</p>
              {MENU_ITEMS.filter(i => i.status === 'live').sort((a, b) => b.orders - a.orders).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: idx < 1 ? '1px solid #1C1C2E' : 'none' }}>
                  <span className="text-lg font-black w-6" style={{ color: '#55556A' }}>{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#EEEEF8' }}>{item.name}</p>
                    <p className="text-[10px]" style={{ color: '#55556A' }}>{item.orders} macro logs</p>
                  </div>
                  <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                    <div className="h-full rounded-full" style={{ width: `${(item.orders / 150) * 100}%`, background: '#4E9BFF' }}/>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <p className="text-sm font-bold mb-3" style={{ color: '#EEEEF8' }}>User Goals Breakdown</p>
              <div className="space-y-2">
                {[
                  { g: 'Weight Loss', pct: 58, col: '#FF5A5A' },
                  { g: 'Muscle Gain', pct: 31, col: '#4E9BFF' },
                  { g: 'Maintenance', pct: 11, col: '#00D68F' },
                ].map(g => (
                  <div key={g.g}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#8888A8' }}>{g.g}</span>
                      <span className="text-xs font-bold" style={{ color: g.col }}>{g.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                      <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.col }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
