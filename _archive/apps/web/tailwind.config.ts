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
        brand: {
          green:       '#00D68F',
          'green-light':'#00EFA0',
          'green-pale': 'rgba(0,214,143,.15)',
          dark:        '#EEEEF8',
          'dark-mid':  '#8888A8',
          grey:        '#55556A',
          'grey-light':'#252538',
          blue:        '#4E9BFF',
          'blue-pale': 'rgba(78,155,255,.15)',
          orange:      '#FF8C42',
          'orange-pale':'rgba(255,140,66,.15)',
          red:         '#FF5A5A',
          'red-pale':  'rgba(255,90,90,.15)',
          purple:      '#9D7BFF',
          'purple-pale':'rgba(157,123,255,.15)',
          yellow:      '#FFD166',
        },
        surface: {
          base:    '#080810',
          card:    '#111120',
          raised:  '#161626',
          elevated:'#1E1E30',
        },
        outline: {
          DEFAULT: '#252538',
          subtle:  '#1C1C2E',
        },
        ink: {
          primary:  '#EEEEF8',
          secondary:'#8888A8',
          muted:    '#55556A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
