'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

import { SPRING } from '@/lib/motion'

// Scroll parallax — translates its child on the Y axis as the section scrolls
// through the viewport, adding depth. `speed` sets the travel (px each way);
// positive drifts up as you scroll (foreground feel), negative drifts down.
// Reduced-motion → static. Spring-smoothed so it glides rather than snaps.
export function Parallax({
  children,
  speed = 60,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const yRaw = useTransform(scrollYProgress, [0, 1], [speed, -speed])
  const y = useSpring(yRaw, SPRING.soft)

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
