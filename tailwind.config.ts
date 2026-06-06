import type { Config } from 'tailwindcss'

// Scoped to the public (frontend) routes only — the Payload admin under
// (payload) ships its own styles and must not be touched by Tailwind's preflight.
export default {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08080b',
        'ink-2': '#0d0d12',
        raise: '#131319',
        line: 'rgba(236,231,221,0.10)',
        bone: '#ece7dd',
        'bone-dim': '#a6a199',
        faint: '#6a665e',
        // primary accent = the S8UL logo's orange
        ember: '#ff6a2a',
        'ember-2': '#ff9a4d',
        // the rest of the logo triad — used for the brand gradient
        brand: {
          blue: '#0a6ad6',
          lime: '#c2e23f',
          orange: '#ff6a2a',
        },
      },
      fontFamily: {
        display: ['var(--font-anton)', 'ui-sans-serif', 'sans-serif'],
        sans: ['var(--font-hanken)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jbm)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        kicker: '0.34em',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        gradient: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        aurora: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(6%,-4%,0) scale(1.15)' },
          '66%': { transform: 'translate3d(-5%,5%,0) scale(0.92)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        floaty: 'floaty 2.4s ease-in-out infinite',
        gradient: 'gradient 7s ease infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'spin-slow': 'spin 9s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
