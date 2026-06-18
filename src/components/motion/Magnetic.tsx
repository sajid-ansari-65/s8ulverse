'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

import { SPRING } from '@/lib/motion'

// Magnetic wrapper — the child drifts toward the cursor while hovered, then
// springs back on leave. Subtle by default (refined, not rubbery). Disabled for
// reduced-motion + coarse pointers (renders the child untouched).
//
// Wrap an interactive element: <Magnetic><a className="btn">…</a></Magnetic>.
export function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(useMotionValue(0), SPRING.responsive)
  const y = useSpring(useMotionValue(0), SPRING.responsive)

  if (reduced) {
    return <div className={className ? `${className} inline-block` : 'inline-block'}>{children}</div>
  }

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className={className ? `${className} inline-block` : 'inline-block'}
    >
      {children}
    </motion.div>
  )
}
