/**
 * StrideWordmark — icon mark + "stride" logotype.
 * Used on login, register, and landing pages.
 *
 * height  — controls overall height (default 40px); width scales at 520:120 ratio.
 * dark    — set true on dark/navy backgrounds to render text in white.
 */
export default function StrideWordmark({
  height = 40,
  dark   = false,
}: {
  height?: number;
  dark?:   boolean;
}) {
  const width    = Math.round(height * (520 / 120));
  const textFill = dark ? '#FFFFFF' : '#0F1B2D';
  // On dark bg: square becomes white/light so the icon is still visible
  const squareFill = dark ? '#FFFFFF' : '#0F1B2D';
  const strokeColor = dark ? '#FFFFFF' : '#0F1B2D';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 120"
      width={width}
      height={height}
      style={{ display: 'block' }}
    >
      {/* Icon square */}
      <rect x="0" y="0" width="120" height="120" rx="28" fill={squareFill} />
      <path
        d="M32 92
           C 32 70, 47 55, 67 49
           C 87 43, 97 36, 95 24
           C 83 36, 65 38, 50 42
           C 27 50, 17 70, 27 95 Z"
        fill="#13A26B"
      />
      <path
        d="M37 85 C 45 70, 60 58, 78 48"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Logotype */}
      <text
        x="148"
        y="83"
        fontFamily="'Archivo Black', 'Anton', 'Helvetica Neue', Arial, sans-serif"
        fontSize="64"
        letterSpacing="-1"
        fill={textFill}
      >
        stride
      </text>
    </svg>
  );
}
