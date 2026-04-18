/**
 * StrideIcon — the app icon mark (square) from the design system.
 * Navy background with green organic stride-path shape.
 * Use size prop to control dimensions (default 40px).
 */
export default function StrideIcon({ size = 40 }: { size?: number }) {
  const r = Math.round(size * 0.225); // corner radius proportional to 230/1024
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="1024" height="1024" rx={r * (1024 / size)} fill="#0F1B2D" />
      <path
        d="M266 758
           C 266 580, 388 460, 552 410
           C 716 360, 796 300, 778 200
           C 676 300, 532 320, 408 360
           C 222 440, 138 600, 220 800 Z"
        fill="#13A26B"
      />
      <path
        d="M320 700 C 380 580, 500 500, 640 430"
        fill="none"
        stroke="#0F1B2D"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
