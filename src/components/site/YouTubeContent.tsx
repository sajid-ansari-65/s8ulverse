'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { formatNumber } from '@/lib/format'
import type { YtChannel } from '@/lib/data'
import type { YtData, YtVideo } from '@/lib/youtube'

const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`
const embed = (id: string) => `https://www.youtube.com/embed/${id}`

const fmtDuration = (s: number) => {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Horizontal rail: fixed height, swipe sideways. Edge fades + hover arrows ──
function Rail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const nudge = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })

  return (
    <div className="group relative -mx-1">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent" />

      {/* hover arrows (pointer devices only) */}
      <button
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ink/80 text-bone opacity-0 backdrop-blur transition-all hover:border-accent/50 hover:text-accent group-hover:opacity-100 md:flex"
      >
        ‹
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => nudge(1)}
        className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ink/80 text-bone opacity-0 backdrop-blur transition-all hover:border-accent/50 hover:text-accent group-hover:opacity-100 md:flex"
      >
        ›
      </button>
    </div>
  )
}

// Landscape long-form / featured / recent card.
function VideoCard({ v }: { v: YtVideo }) {
  return (
    <a
      href={watch(v.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group/card block snap-start overflow-hidden rounded-xl border border-line bg-raise/40 transition-colors hover:border-accent/40"
    >
      <div className="relative aspect-video overflow-hidden bg-ink-2">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        )}
        {v.live ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-ink/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-red-400 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Live
          </span>
        ) : (
          v.durationSeconds > 0 && (
            <span className="absolute bottom-2 right-2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-bone backdrop-blur">
              {fmtDuration(v.durationSeconds)}
            </span>
          )
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm text-bone">{v.title}</p>
        {v.views > 0 && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {formatNumber(v.views)} views
          </p>
        )}
      </div>
    </a>
  )
}

// Vertical 9:16 short card.
function ShortCard({ v }: { v: YtVideo }) {
  return (
    <a
      href={watch(v.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group/card block snap-start overflow-hidden rounded-xl border border-line bg-raise/40 transition-colors hover:border-accent/40"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-ink-2">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent backdrop-blur">
          Short
        </span>
        <div className="absolute inset-x-3 bottom-3">
          <p className="line-clamp-2 text-xs font-medium text-bone">{v.title}</p>
          {v.views > 0 && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              {formatNumber(v.views)} views
            </p>
          )}
        </div>
      </div>
    </a>
  )
}

function Embed({ v }: { v: YtVideo }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="relative aspect-video">
        <iframe
          src={embed(v.id)}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="p-4 text-bone">{v.title}</p>
    </div>
  )
}

type Tab = 'live' | 'featured' | 'videos' | 'shorts'

// One channel: per-channel stats line + animated Live/Featured/Videos/Shorts tabs.
function ChannelView({ data }: { data: YtData }) {
  const videos = data.videos ?? []
  const shorts = data.shorts ?? []
  const tabs: Array<{ key: Tab; label: string; show: boolean; count?: number }> = [
    { key: 'live', label: 'Live', show: Boolean(data.live) },
    { key: 'featured', label: 'Featured', show: Boolean(data.featured) },
    { key: 'videos', label: 'Videos', show: videos.length > 0, count: videos.length },
    { key: 'shorts', label: 'Shorts', show: shorts.length > 0, count: shorts.length },
  ]
  const available = tabs.filter((t) => t.show)
  const [tab, setTab] = useState<Tab>(available[0]?.key ?? 'videos')

  if (!available.length) return null

  return (
    <>
      {/* stats line */}
      <div className="mt-5 flex gap-6 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        {data.subscribers > 0 && (
          <span>
            <span className="display mr-1 text-xl text-bone">{formatNumber(data.subscribers)}</span>
            subs
          </span>
        )}
        <span>
          <span className="display mr-1 text-xl text-bone">{formatNumber(data.videoCount)}</span>
          videos
        </span>
        <span className="hidden sm:inline">
          <span className="display mr-1 text-xl text-bone">{formatNumber(data.views)}</span>
          views
        </span>
      </div>

      {/* animated segmented tab bar */}
      <div className="mt-6 inline-flex flex-wrap gap-1 rounded-full border border-line bg-raise/30 p-1">
        {available.map((t) => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="yt-active-tab"
                  className="absolute inset-0 rounded-full border border-accent/40 bg-accent/15"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center transition-colors ${
                  isActive ? 'text-accent' : 'text-bone-dim hover:text-bone'
                }`}
              >
                {t.key === 'live' && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                )}
                {t.label}
                {t.count != null && (
                  <span className={`ml-1.5 ${isActive ? 'text-accent/70' : 'text-faint'}`}>
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* tab panel — fades on switch */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {tab === 'live' && data.live && <Embed v={data.live} />}
            {tab === 'featured' && data.featured && <Embed v={data.featured} />}
            {tab === 'videos' && (
              <Rail>
                {videos.slice(0, 18).map((v) => (
                  <div key={v.id} className="w-[280px] shrink-0 sm:w-[320px]">
                    <VideoCard v={v} />
                  </div>
                ))}
              </Rail>
            )}
            {tab === 'shorts' && (
              <Rail>
                {shorts.map((v) => (
                  <div key={v.id} className="w-[150px] shrink-0 sm:w-[168px]">
                    <ShortCard v={v} />
                  </div>
                ))}
              </Rail>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

export function YouTubeContent({
  channels,
  bare = false,
}: {
  channels: YtChannel[]
  bare?: boolean
}) {
  const [active, setActive] = useState(0)
  if (!channels.length) return null

  const idx = Math.min(active, channels.length - 1)
  const current = channels[idx]
  const multi = channels.length > 1

  return (
    <section className={bare ? '' : 'mt-20'}>
      {!bare && (
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-kicker text-accent">On YouTube</p>
              <h2 className="display mt-3 text-4xl text-bone">{multi ? 'Channels' : 'Channel'}</h2>
            </div>
            {multi && (
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                {channels.length} channels
              </span>
            )}
          </div>
        </Reveal>
      )}

      {/* Channel switcher (only when >1) */}
      {multi && (
        <div className="mt-6 flex flex-wrap gap-2">
          {channels.map((c, i) => (
            <button
              key={c.label + i}
              onClick={() => setActive(i)}
              className={`rounded-full border px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                i === idx
                  ? 'border-bone bg-bone text-ink'
                  : 'border-line text-bone-dim hover:text-bone'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Per-channel content — keyed so switching resets to its first tab */}
      <ChannelView key={idx} data={current.data} />
    </section>
  )
}
