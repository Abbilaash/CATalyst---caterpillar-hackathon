/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cat: {
          yellow: '#FFCD11',
          'yellow-dark': '#E6B800',
          'yellow-soft': '#FFD84D',
        },
        ink: {
          900: '#0E0F11',
          800: '#111315',
          700: '#16181B',
          600: '#1B1D20',
          500: '#22252A',
          400: '#2A2E34',
          300: '#3A3F47',
          200: '#5A6170',
          100: '#8A93A1',
          50: '#C7CCD4',
        },
        ok: { DEFAULT: '#22C55E', soft: '#16A34A' },
        warn: { DEFAULT: '#F59E0B', soft: '#D97706' },
        crit: { DEFAULT: '#EF4444', soft: '#DC2626' },
        info: { DEFAULT: '#3B82F6', soft: '#2563EB' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(255,205,17,0.25), 0 8px 32px rgba(255,205,17,0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
