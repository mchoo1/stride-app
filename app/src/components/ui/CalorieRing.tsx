'use client';

/**
 * CalorieRing — SVG progress ring on green hero card.
 * White track, white fill, kcal remaining centered.
 */
export default function CalorieRing({
  eaten,
  budget,
  burned = 0,
  size = 128,
}: {
  eaten: number;
  budget: number;
  burned?: number;
  size?: number;
}) {
  const total = budget + burned;
  const remaining = Math.max(0, total - eaten);
  const frac = total > 0 ? Math.min(1, eaten / total) : 0;
  const strokeW = 11;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={strokeW}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <span
          style={{
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: size >= 128 ? 30 : 22,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {remaining.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            opacity: 0.82,
            marginTop: 3,
            letterSpacing: '0.02em',
          }}
        >
          kcal left
        </span>
      </div>
    </div>
  );
}
