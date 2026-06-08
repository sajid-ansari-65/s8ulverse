'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'

export interface ProfileTab {
  key: string
  label: string
  content: ReactNode
}

// Top-level profile navigation — editorial numbered tabs with a sliding ember
// underline. Deliberately distinct from the small mono pills used inside the
// YouTube section, so the page hierarchy reads clearly.
export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  if (!tabs.length) return null

  const current = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div className="mt-16">
      {/* Tab bar */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-line sm:gap-x-12">
        {tabs.map((t, i) => {
          const on = t.key === current.key
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className="relative -mb-px pb-4 text-left outline-none"
            >
              <span
                className={`block font-mono text-[10px] tracking-[0.22em] transition-colors ${
                  on ? 'text-ember' : 'text-faint'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`display mt-1 block text-2xl leading-none transition-colors sm:text-3xl ${
                  on ? 'text-bone' : 'text-bone-dim hover:text-bone'
                }`}
              >
                {t.label}
              </span>
              {on && (
                <motion.span
                  layoutId="profile-tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-ember"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Active panel — fades / slides on switch */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
