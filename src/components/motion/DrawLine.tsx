'use client'

import { motion, useReducedMotion } from 'motion/react'

import { EASE_OUT, DUR } from '@/lib/motion'

// Accent rule that draws itself left→right when it scrolls into view. Drop it on
// top of a section's bottom border for a premium "underline draw". Reduced-motion
// → appears full-width instantly.
export function DrawLine({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left bg-accent ${className}`}
      initial={reduced ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: DUR.slow, ease: EASE_OUT }}
    />
  )
}
