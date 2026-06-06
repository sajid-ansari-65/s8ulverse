'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

import type { HomepageContent } from '@/lib/data'

type HeroContent = Pick<
  HomepageContent,
  'heroEyebrow' | 'heroHeadline' | 'heroGhostText' | 'heroSubtitle' | 'heroCtaLabel' | 'heroCtaHref'
>

export function Hero({
  orgs,
  memberCount,
  content,
}: {
  orgs: string[]
  memberCount: number
  content: HeroContent
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const ghostY = useTransform(scrollYProgress, [0, 1], [0, -140])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const ticker = [...orgs, ...orgs, ...orgs]

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* aurora — drifting blobs in the three S8UL logo colors */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[8%] h-[42vw] w-[42vw] animate-aurora rounded-full bg-brand-blue/20 blur-[100px]" />
        <div className="absolute right-[2%] top-[24%] h-[34vw] w-[34vw] animate-aurora rounded-full bg-brand-orange/20 blur-[100px] [animation-delay:-6s]" />
        <div className="absolute bottom-[6%] left-[28%] h-[30vw] w-[30vw] animate-aurora rounded-full bg-brand-lime/10 blur-[110px] [animation-delay:-11s]" />
      </div>

      {/* ghost wordmark */}
      <motion.div
        aria-hidden
        style={{ y: ghostY }}
        className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-center"
      >
        <span className="display text-stroke whitespace-nowrap text-[26vw] leading-none opacity-[0.10]">
          {content.heroGhostText}
        </span>
      </motion.div>

      {/* faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] mask-fade-b"
        style={{
          backgroundImage:
            'linear-gradient(rgba(236,231,221,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(236,231,221,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative z-10 mx-auto w-full max-w-[1500px] px-5 pb-16 sm:px-8"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="font-mono text-[11px] tracking-kicker text-ember sm:text-xs"
        >
          {content.heroEyebrow}
        </motion.p>

        <h1 className="display mt-5 text-[18vw] leading-[0.82] sm:text-[15vw] lg:text-[12rem]">
          {content.heroHeadline.map((line, i) => (
            <span key={line.word + i} className="block overflow-hidden">
              <motion.span
                className={`inline-block ${line.accent ? 'brand-text animate-gradient' : 'text-bone'}`}
                initial={{ y: '115%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              >
                {line.word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-8 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="text-lg text-bone-dim">{content.heroSubtitle}</p>
          <a
            href={content.heroCtaHref}
            className="frame group inline-flex shrink-0 items-center gap-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bone transition-colors hover:text-ember"
          >
            {content.heroCtaLabel}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </motion.div>

      {/* org ticker */}
      <motion.div
        style={{ opacity: fade }}
        className="relative z-10 border-y border-line py-4 mask-fade-x"
      >
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
          {ticker.map((o, i) => (
            <span key={i} className="flex items-center gap-10 font-mono text-xs uppercase tracking-[0.25em] text-bone-dim">
              {o}
              <span className="text-ember">✦</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* scroll cue */}
      <div className="pointer-events-none absolute bottom-24 right-6 hidden flex-col items-center gap-2 lg:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint [writing-mode:vertical-rl]">
          {memberCount > 0 ? `${memberCount} legends` : 'Scroll'}
        </span>
        <span className="h-12 w-px animate-floaty bg-gradient-to-b from-ember to-transparent" />
      </div>
    </section>
  )
}
