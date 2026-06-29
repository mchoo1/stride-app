'use client';

/**
 * ValueBadge — hero metric: protein per dollar.
 * Gold-tint pill by default; solid gold when value ≥ 5 (top tier).
 */
export default function ValueBadge({ value }: { value: number }) {
  const top = value >= 5;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 2,
        padding: '3px 9px',
        borderRadius: 9,
        background: top ? 'var(--gold)' : 'var(--gold-tint)',
        color: top ? '#fff' : 'var(--gold)',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {value.toFixed(1)}
      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>g/$</span>
    </span>
  );
}
