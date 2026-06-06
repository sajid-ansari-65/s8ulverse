'use client'

import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { formatNumber } from '@/lib/format'

// Counts from 0 → `to` the first time it scrolls into view.
export function CountUp({
  to,
  compact = false,
  duration = 1.6,
}: {
  to: number
  compact?: boolean
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    })
    return () => controls.stop()
  }, [inView, to, duration])

  return <span ref={ref}>{compact ? formatNumber(Math.round(val)) : Math.round(val).toLocaleString()}</span>
}
