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
          navy:          '#0F1B2D',
          green:         '#1E7F5C',
          'green-bright':'#13A26B',
          amber:         '#F2A93B',
          red:           '#D04E36',
        },
        canvas:   '#F7F8FB',
        card:     '#FFFFFF',
        hairline: '#E5E9F2',
        fg: {
          1: '#0F1B2D',
          2: '#5B6576',
          3: '#8B95A7',
        },
        macro: {
          protein: '#2E6FB8',
          carbs:   '#C98A2E',
          fat:     '#1E7F5C',
        },
        pillar: {
          track:   '#1E7F5C',
          monitor: '#2E6FB8',
          eat:     '#C98A2E',
          move:    '#7A4BC2',
        },
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Impact', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)',
        raised: '0 2px 8px rgba(15,27,45,0.06), 0 1px 3px rgba(15,27,45,0.04)',
        hero:   '0 8px 24px rgba(15,27,45,0.08), 0 2px 8px rgba(15,27,45,0.04)',
        cta:    '0 6px 20px rgba(30,127,92,0.25)',
      },
      borderRadius: {
        xs:   '8px',
        sm:   '12px',
        md:   '16px',
        lg:   '20px',
        xl:   '28px',
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
