import Link from 'next/link'

import { Reveal } from '@/components/motion/Reveal'
import { Container } from '@/components/ui'
import { formatNumber } from '@/lib/format'
import type { LiveCreator } from '@/lib/data'

// Homepage "Live now" band — only rendered when ≥1 creator is streaming.
export function LiveNow({ creators }: { creators: LiveCreator[] }) {
  if (!creators.length) return null

  return (
    <Container className="pt-24">
      <Reveal>
        <div className="flex items-center gap-3 border-b border-red-500/30 pb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-kicker text-red-400">
            Live now · {creators.length} streaming
          </p>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.06}>
            <a
              href={`https://www.youtube.com/watch?v=${c.video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl border border-red-500/20 bg-raise/50 transition-colors hover:border-red-500/50"
            >
              <div className="relative aspect-video overflow-hidden bg-ink-2">
                {c.video.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.video.thumbnail}
                    alt={c.video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/60 bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-red-400 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Live
                </span>
                {c.video.views > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone backdrop-blur">
                    {formatNumber(c.video.views)} watching
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 p-4">
                <span
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-line"
                  style={{ boxShadow: `0 0 0 2px ${c.accent}44` }}
                >
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt={c.ign} className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center font-mono text-xs text-bone"
                      style={{ backgroundColor: `${c.accent}33` }}
                    >
                      {c.ign.charAt(0)}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                    {c.ign}
                    {c.org && <span className="text-faint"> · {c.org}</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-bone">{c.video.title}</p>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <div className="mt-5">
        <Link
          href="/players"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim transition-colors hover:text-accent"
        >
          All creators →
        </Link>
      </div>
    </Container>
  )
}
