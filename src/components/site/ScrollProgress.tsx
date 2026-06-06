'use client'

import { motion, useScroll, useSpring } from 'motion/react'

// Broadcast-style scroll indicator in the brand gradient, pinned to the top.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <motion.div
      style={{ scaleX }}
      className="brand-rule fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
    />
  )
}
