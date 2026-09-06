import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0d0b',
        panel: '#0f1310',
        border: '#1f2621',
        'border-strong': '#2c352e',
        ink: '#e6ebe7',
        muted: '#8a938c',
        faint: '#5b6560',
        accent: '#4ade80',
        'accent-dim': '#1f3d2a',
        danger: '#e0725c',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '46rem',
      },
    },
  },
  plugins: [],
};

export default config;
