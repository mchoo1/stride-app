'use client';

interface MacroData {
  protein: { have: number; goal: number };
  carbs:   { have: number; goal: number };
  fat:     { have: number; goal: number };
}

/**
 * MacroBars — 3 thin labelled progress bars.
 * onDark=true → white labels + track on green hero card.
 */
export default function MacroBars({
  data,
  onDark = false,
}: {
  data: MacroData;
  onDark?: boolean;
}) {
  const items = [
    { key: 'Protein', v: data.protein, accent: onDark ? '#fff' : 'var(--green-bright)' },
    { key: 'Carbs',   v: data.carbs,   accent: onDark ? '#fff' : 'var(--gold-bright)'  },
    { key: 'Fat',     v: data.fat,     accent: onDark ? '#fff' : 'var(--coral)'        },
  ];

  const trackBg  = onDark ? 'rgba(255,255,255,0.20)' : 'var(--surface-2)';
  const labelClr = onDark ? 'rgba(255,255,255,0.80)' : 'var(--muted)';
  const valClr   = onDark ? '#fff'                   : 'var(--ink)';

  return (
    <div style={{ display: 'flex', gap: 14, flex: 1 }}>
      {items.map(({ key, v, accent }) => {
        const pct = v.goal > 0 ? Math.min(100, (v.have / v.goal) * 100) : 0;
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: labelClr }}>{key}</span>
            <div style={{ height: 5, borderRadius: 999, background: trackBg, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: accent,
                  transition: 'width .5s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: '"Space Grotesk", system-ui, sans-serif',
                fontSize: 11.5,
                fontWeight: 600,
                color: valClr,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v.have}
              <span style={{ opacity: 0.6 }}>/{v.goal}g</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
