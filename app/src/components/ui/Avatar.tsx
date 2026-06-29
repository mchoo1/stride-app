'use client';

/**
 * Avatar — ONE consistent style across the app.
 * bg surface-2, green-deep letter, rounded tile.
 * No rainbow / hue-rotation variants.
 */
export default function Avatar({
  name,
  size = 46,
  radius = 14,
  dark = false,
}: {
  name: string;
  size?: number;
  radius?: number;
  /** dark = ink background + white letter (profile header) */
  dark?: boolean;
}) {
  const letter = name.trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: dark ? 'var(--ink)' : 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        color: dark ? '#fff' : 'var(--green-deep)',
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}
    >
      {letter}
    </div>
  );
}
