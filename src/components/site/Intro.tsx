'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

// Cinematic page-load curtain: the S8UL mark resolves, a brand-gradient line
// draws beneath it, then the whole panel wipes up to reveal the hero.
// Plays once per full load (the layout persists across client navigation).
export function Intro({
  wordmark = 'VERSE',
  tagline = 'Where legends live',
}: {
  wordmark?: string
  tagline?: string
}) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    // respect reduced-motion: skip the curtain entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
      return
    }
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => setDone(true), 1850)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (done) document.body.style.overflow = ''
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.85, 0, 0.15, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s8ul-logo-nav.webp" alt="S8UL" className="h-14 w-auto" />
            <span className="display text-4xl text-bone">{wordmark}</span>
          </motion.div>

          <motion.div
            className="brand-rule mt-6 h-[3px] rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-5 font-mono text-[10px] uppercase tracking-[0.4em] text-faint"
          >
            {tagline}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
