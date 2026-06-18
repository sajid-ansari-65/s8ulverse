'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

import { SPRING } from '@/lib/motion'

// Branded cursor — a precise dot that snaps to the pointer + a ring that trails
// with a spring and grows/tints to the active kit accent over interactive
// elements. Desktop-only (fine pointer, not reduced-motion); on touch the native
// cursor is left untouched. pointer-events-none so it never blocks clicks.
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [hot, setHot] = useState(false) // over an interactive element

  // dot tracks instantly; ring trails via spring
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, SPRING.trailing)
  const ringY = useSpring(y, SPRING.trailing)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    setEnabled(true)
    document.documentElement.classList.add('has-custom-cursor')

    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target as HTMLElement | null
      setHot(Boolean(t?.closest('a, button, [role="button"], [data-cursor], input, textarea, select')))
    }
    window.addEventListener('mousemove', move, { passive: true })

    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* precise centre dot */}
      <motion.div
        className="absolute h-1.5 w-1.5 rounded-full bg-accent"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      {/* trailing ring — grows + brightens over interactive targets */}
      <motion.div
        className="absolute rounded-full border border-accent/60"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hot ? 46 : 30,
          height: hot ? 46 : 30,
          opacity: hot ? 1 : 0.5,
          backgroundColor: hot ? 'rgb(var(--kit-primary-rgb) / 0.10)' : 'rgb(var(--kit-primary-rgb) / 0)',
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      />
    </div>
  )
}
