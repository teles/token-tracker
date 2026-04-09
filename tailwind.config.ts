import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular']
      },
      colors: {
        panel: {
          900: '#081329',
          800: '#0c1a35',
          700: '#152347'
        },
        accent: {
          500: '#22d3ee',
          400: '#34d399',
          300: '#67e8f9'
        }
      },
      boxShadow: {
        panel: '0 18px 45px rgba(2, 6, 23, 0.55)',
        glow: '0 0 0 1px rgba(103, 232, 249, 0.25), 0 0 24px rgba(34, 211, 238, 0.2)'
      }
    }
  },
  plugins: []
} satisfies Config;
