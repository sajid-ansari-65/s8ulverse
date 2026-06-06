'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'motion/react'

// Fixed cinematic backdrop: a mouse-reactive spotlight, a film-grain layer and
// an edge vignette. Pure ambience — pointer-events disabled throughout.
export function Atmosphere() {
  const x = useMotionValue(50)
  const y = useMotionValue(18)
  const sx = useSpring(x, { stiffness: 55, damping: 22 })
  const sy = useSpring(y, { stiffness: 55, damping: 22 })
  const mx = useMotionTemplate`${sx}%`
  const my = useMotionTemplate`${sy}%`

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth) * 100)
      y.set((e.clientY / window.innerHeight) * 100)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [x, y])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          // spotlight follows the cursor
          ['--mx' as string]: mx,
          ['--my' as string]: my,
          background:
            'radial-gradient(38% 38% at var(--mx) var(--my), rgba(255,90,54,0.15), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 30%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  )
}
