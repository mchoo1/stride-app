import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces ────────────────────────────────────────────────────────
        bg:         '#f1f5f0',
        surface:    '#ffffff',
        'surface-2':'#e9efe8',
        'surface-3':'#f4f8f3',

        // ── Ink ─────────────────────────────────────────────────────────────
        ink:   '#0f2a1d',
        'ink-2':'#46564e',
        muted: '#8a978f',
        faint: '#b6c0b8',
        line:  '#e5ebe4',

        // ── Brand green ─────────────────────────────────────────────────────
        green: {
          DEFAULT:  '#0e7a4f',
          deep:     '#0a5c3b',
          bright:   '#16a06a',
          tint:     '#e1efe8',
          'tint-2': '#cfe6d9',
        },

        // ── Gold (VALUE = protein per dollar) ───────────────────────────────
        gold: {
          DEFAULT: '#c6841a',
          bright:  '#e6a52a',
          tint:    '#f9edd2',
        },

        // ── Coral (ENERGY = calories) ────────────────────────────────────────
        coral: {
          DEFAULT: '#df5f3b',
          tint:    '#fae2d9',
        },
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'monospace'],
      },

      fontSize: {
        'title':   ['32px', { fontWeight: '700', lineHeight: '1.1' }],
        'section': ['18px', { fontWeight: '600', lineHeight: '1.3' }],
        'body':    ['15px', { fontWeight: '500', lineHeight: '1.5' }],
        'body-sm': ['14px', { fontWeight: '500', lineHeight: '1.5' }],
        'eyebrow': ['11px', { fontWeight: '600', lineHeight: '1.4' }],
      },

      borderRadius: {
        card:   '22px',
        hero:   '28px',
        chip:   '999px',
        btn:    '15px',
        sm:     '12px',
        pill: '999px',
      },
      animation: {
        'fade-in':    'fadeIn .3s ease-in-out',
        'slide-up':   'slideUp .3s ease-out',
        'slide-down': 'slideDown .3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.6' } },
      },
    },
  },
  plugins: [],
};

export default config;
