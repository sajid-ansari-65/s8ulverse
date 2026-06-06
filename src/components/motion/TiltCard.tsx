'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'

// 3D spotlight card: tilts toward the cursor, with a moving sheen and an
// accent-tinted glow that tracks the pointer. The whole surface stays one
// cohesive plane (preserve-3d) for a premium, physical feel.
export function TiltCard({
  children,
  accent = '#ff5a36',
  className = '',
  max = 8,
}: {
  children: ReactNode
  accent?: string
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glX = useMotionTemplate`${gx}%`
  const glY = useMotionTemplate`${gy}%`
  const transform = useMotionTemplate`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set((0.5 - py) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform, transformStyle: 'preserve-3d' }}
      className={`group relative ${className}`}
    >
      {/* accent glow that tracks the cursor */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          ['--gx' as string]: glX,
          ['--gy' as string]: glY,
          background: `radial-gradient(420px circle at var(--gx) var(--gy), ${accent}22, transparent 45%)`,
        }}
      />
      {children}
      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          aria-hidden
          className="absolute -inset-y-10 left-0 w-1/3 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
        />
      </div>
    </motion.div>
  )
}
