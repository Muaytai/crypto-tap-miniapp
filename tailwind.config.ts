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
      },
    },
  },
  plugins: [],
};

export default config;