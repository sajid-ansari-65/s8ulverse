// Shared motion language — one set of easings + durations so every animation on
// the site feels like it comes from the same hand (refined, fast, purposeful).
// Import these instead of hand-typing cubic-beziers per component.

import type { Transition } from 'motion/react'

// Easings
export const EASE_OUT = [0.16, 1, 0.3, 1] as const // expo-out — the house curve
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
export const EASE_SOFT = [0.25, 0.1, 0.25, 1] as const

// Durations (seconds)
export const DUR = {
  fast: 0.25,
  base: 0.5,
  slow: 0.7,
  xslow: 0.95,
} as const

// Spring presets for cursor-follow / magnetic / tilt — calm and premium, not bouncy.
export const SPRING = {
  // snappy but settled — magnetic buttons, tilt
  responsive: { stiffness: 150, damping: 18, mass: 0.6 },
  // smooth trailing — custom cursor ring
  trailing: { stiffness: 350, damping: 30, mass: 0.5 },
  // gentle — large parallax elements
  soft: { stiffness: 80, damping: 20, mass: 0.8 },
} as const

// Default reveal transition (used by Reveal and friends).
export const revealTransition = (delay = 0): Transition => ({
  duration: DUR.slow,
  delay,
  ease: EASE_OUT,
})
