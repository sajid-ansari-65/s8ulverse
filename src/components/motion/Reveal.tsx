'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE_OUT, DUR } from '@/lib/motion'

// Scroll-triggered reveal — rises + fades (optionally scale/blur) into view once.
// Respects prefers-reduced-motion: reduced users get the content instantly, no
// transform. Use `delay` to orchestrate staggered sequences within a section.
export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = false,
  scale = false,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  blur?: boolean
  scale?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y,
        ...(scale ? { scale: 0.96 } : {}),
        ...(blur ? { filter: 'blur(8px)' } : {}),
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        ...(scale ? { scale: 1 } : {}),
        ...(blur ? { filter: 'blur(0px)' } : {}),
      }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: DUR.slow, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

// Staggered group — children animate in sequence as the group enters view.
// Wrap each child in <RevealItem>. Reduced-motion → instant.
export function RevealStagger({
  children,
  stagger = 0.08,
  className,
}: {
  children: ReactNode
  stagger?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px' }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  y = 22,
  className,
}: {
  children: ReactNode
  y?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  )
}
