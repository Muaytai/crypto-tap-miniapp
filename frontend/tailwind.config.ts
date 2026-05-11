import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['var(--font-silkscreen)', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        workshop: {
          bg: '#2a2319',
          panel: '#1a1510',
          wood: '#3d2f22',
          tile: '#352a1f',
        },
      },
      animation: {
        ripple: 'ripple 0.4s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        'tap-glow': 'tap-glow 2.8s ease-in-out infinite',
        'ach-gold-ring': 'ach-gold-ring 2.6s ease-in-out infinite',
        'ach-cyan-glow': 'ach-cyan-glow 2.2s ease-in-out infinite',
        'ach-shine': 'ach-shine 3.2s linear infinite',
        'ach-bubble': 'ach-bubble 1.9s ease-in-out infinite',
        'ach-bubble-2': 'ach-bubble 1.9s ease-in-out 0.45s infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'tap-glow': {
          '0%, 100%': { boxShadow: '0 0 28px rgba(34,211,238,0.45), 0 0 56px rgba(14,165,233,0.2), inset 0 0 24px rgba(255,255,255,0.12)' },
          '50%': { boxShadow: '0 0 40px rgba(34,211,238,0.65), 0 0 72px rgba(14,165,233,0.35), inset 0 0 28px rgba(255,255,255,0.18)' },
        },
        'ach-gold-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(246,205,45,0.22), 0 0 14px rgba(246,205,45,0.1)' },
          '50%': { boxShadow: '0 0 0 2px rgba(246,205,45,0.18), 0 0 22px rgba(246,205,45,0.28)' },
        },
        'ach-cyan-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,211,238,0.12)' },
          '50%': { boxShadow: '0 0 18px rgba(34,211,238,0.32)' },
        },
        'ach-shine': {
          '0%': { backgroundPosition: '120% 0' },
          '100%': { backgroundPosition: '-120% 0' },
        },
        'ach-bubble': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;