import * as React from 'react'

import { DrawLine } from '@/components/motion/DrawLine'

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ')

export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cx('mx-auto w-full max-w-[1500px] px-5 sm:px-8', className)}>{children}</div>
}

export function SectionHeading({
  kicker,
  title,
  index,
}: {
  kicker: string
  title: string
  index?: string
}) {
  return (
    <div className="relative flex items-end justify-between gap-6 border-b border-line pb-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-kicker text-accent">{kicker}</p>
        <h2 className="display mt-3 text-4xl text-bone sm:text-6xl">{title}</h2>
      </div>
      {index && (
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-faint sm:block">
          {index}
        </span>
      )}
      <DrawLine className="absolute -bottom-px left-0 w-24" />
    </div>
  )
}

// 'ember' kept as the variant name (used across the site) but now renders in the
// active kit accent (--kit-primary) — blue by default, org-themed inside .kit-theme.
type PillVariant = 'ember' | 'ghost' | 'solid' | 'metal'

const pill: Record<PillVariant, string> = {
  ember: 'border border-accent/40 bg-accent/10 text-accent',
  ghost: 'border border-line text-bone-dim',
  solid: 'bg-bone text-ink',
  metal: 'border border-accent-metal/40 bg-accent-metal/10 text-accent-metal',
}

export function Pill({
  variant = 'ghost',
  className,
  children,
}: {
  variant?: PillVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]',
        pill[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Initial-letter portrait with an accent wash — the cinematic fallback when no
// image has been uploaded yet.
export function Initial({
  label,
  accent,
  className,
}: {
  label: string
  accent: string
  className?: string
}) {
  return (
    <div
      className={cx('flex items-center justify-center', className)}
      style={{
        background: `radial-gradient(120% 120% at 30% 20%, ${accent}40, transparent 60%), linear-gradient(160deg, #16161c, #0b0b0f)`,
      }}
    >
      <span className="display text-bone/20" style={{ fontSize: '3.5em', lineHeight: 1 }}>
        {label.charAt(0)}
      </span>
    </div>
  )
}
