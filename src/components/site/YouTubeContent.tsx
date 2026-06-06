'use client'

import { useState } from 'react'

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

// Landscape long-form / featured / recent card.
function VideoCard({ v }: { v: YtVideo }) {
  return (
    <a
      href={watch(v.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-line bg-raise/40 transition-colors hover:border-ember/40"
    >
      <div className="relative aspect-video overflow-hidden bg-ink-2">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      className="group block overflow-hidden rounded-xl border border-line bg-raise/40 transition-colors hover:border-ember/40"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-ink-2">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ember backdrop-blur">
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

// One channel: per-channel stats line + Live/Featured/Videos/Shorts tabs.
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

      <div className="mt-6 flex flex-wrap gap-2">
        {available.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              tab === t.key
                ? 'border-ember/40 bg-ember/10 text-ember'
                : 'border-line text-bone-dim hover:text-bone'
            }`}
          >
            {t.key === 'live' && (
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 align-middle" />
            )}
            {t.label}
            {t.count != null && <span className="ml-1.5 text-faint">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'live' && data.live && <Embed v={data.live} />}
        {tab === 'featured' && data.featured && <Embed v={data.featured} />}
        {tab === 'videos' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 9).map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        )}
        {tab === 'shorts' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shorts.slice(0, 10).map((v) => (
              <ShortCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export function YouTubeContent({ channels }: { channels: YtChannel[] }) {
  const [active, setActive] = useState(0)
  if (!channels.length) return null

  const idx = Math.min(active, channels.length - 1)
  const current = channels[idx]
  const multi = channels.length > 1

  return (
    <section className="mt-20">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">On YouTube</p>
            <h2 className="display mt-3 text-4xl text-bone">
              {multi ? 'Channels' : 'Channel'}
            </h2>
          </div>
          {multi && (
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              {channels.length} channels
            </span>
          )}
        </div>
      </Reveal>

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
