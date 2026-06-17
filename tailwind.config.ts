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
        // 2026/27 kit identity — S8UL EWC + SouL merch converge on white+electric-blue.
        // This blue is now the lead family accent across the site.
        kit: {
          blue: '#1b6fff',
          white: '#f4f7ff',
          green: '#16c79a', // iQOO green spark
          gold: '#d4af37', // SouL heritage / championship metal
          violet: '#6d28d9', // 8Bit heritage
          silver: '#c8ccd4',
        },
        // ember (old logo orange) demoted to a minor legacy spark — kept so any
        // lingering reference still resolves, but no longer the lead.
        ember: '#ff6a2a',
        'ember-2': '#ff9a4d',
        // the S8UL logo triad — still used for the brand wordmark gradient
        brand: {
          blue: '#0a6ad6',
          lime: '#c2e23f',
          orange: '#ff6a2a',
        },
        // CSS-var driven accent — a section sets the --kit-*-rgb channel vars
        // (via kitVars()) and these resolve to the active org's kit colours.
        // Stored as "R G B" channels (not hex) so Tailwind opacity modifiers
        // like bg-accent/10 work — a hex var would make them emit no CSS.
        accent: 'rgb(var(--kit-primary-rgb, 27 111 255) / <alpha-value>)',
        'accent-2': 'rgb(var(--kit-secondary-rgb, 244 247 255) / <alpha-value>)',
        'accent-metal': 'rgb(var(--kit-metal-rgb, 212 175 55) / <alpha-value>)',
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
        // gold/silver foil sweep for championship type (.metal-text)
        foil: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // soft pulse for the live-season status dot
        livepulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.8)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        floaty: 'floaty 2.4s ease-in-out infinite',
        gradient: 'gradient 7s ease infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'spin-slow': 'spin 9s linear infinite',
        foil: 'foil 6s ease infinite',
        livepulse: 'livepulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
