'use client'

import { useEffect, useState } from 'react'

type Parts = { d: number; h: number; m: number; s: number }

function diff(target: number): Parts {
  const t = Math.max(0, target - Date.now())
  return {
    d: Math.floor(t / 86_400_000),
    h: Math.floor(t / 3_600_000) % 24,
    m: Math.floor(t / 60_000) % 60,
    s: Math.floor(t / 1000) % 60,
  }
}

// Live countdown to an ISO target. Renders placeholders until mounted to avoid
// a server/client hydration mismatch.
export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime()
  const [parts, setParts] = useState<Parts | null>(null)

  useEffect(() => {
    setParts(diff(target))
    const id = setInterval(() => setParts(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const cells: Array<[string, number | undefined]> = [
    ['Days', parts?.d],
    ['Hrs', parts?.h],
    ['Min', parts?.m],
    ['Sec', parts?.s],
  ]

  return (
    <div className="flex gap-2 sm:gap-3">
      {cells.map(([label, v]) => (
        <div
          key={label}
          className="flex min-w-[64px] flex-col items-center rounded-xl border border-line bg-ink/60 px-3 py-3 backdrop-blur sm:min-w-[76px]"
        >
          <span className="display text-4xl tabular-nums text-bone sm:text-5xl">
            {v == null ? '--' : String(v).padStart(2, '0')}
          </span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
