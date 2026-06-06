import { Countdown } from '@/components/site/Countdown'
import { Reveal } from '@/components/motion/Reveal'
import { Container, SectionHeading } from '@/components/ui'
import type { FeaturedEventContent } from '@/lib/data'

type Match = {
  id: string | number
  opponent: string
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED'
  competition?: string | null
  game?: string | null
  startsAt: string
}

const statusStyle: Record<Match['status'], string> = {
  LIVE: 'border-red-500/40 bg-red-500/10 text-red-400',
  UPCOMING: 'border-ember/30 bg-ember/10 text-ember',
  COMPLETED: 'border-line text-faint',
}

function fmt(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} · ${time}`
}

export function EwcSection({ matches, event }: { matches: Match[]; event: FeaturedEventContent }) {
  return (
    <Container className="pt-28">
      <Reveal>
        <SectionHeading kicker={event.kicker} title={event.title} index={event.dateRangeLabel} />
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* event + countdown */}
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-raise/50 p-8">
            <div
              aria-hidden
              className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-ember/15 blur-3xl"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {event.location} · {event.prize} prize pool
            </p>
            <p className="display mt-4 text-3xl text-bone sm:text-4xl">{event.eventName}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-bone-dim">{event.description}</p>
            <div className="mt-8">
              <Countdown to={event.startsAt} />
            </div>
          </div>
        </Reveal>

        {/* fixtures */}
        <Reveal delay={0.08}>
          <div className="overflow-hidden rounded-2xl border border-line">
            {matches.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-raise/40 ${
                  i > 0 ? 'border-t border-line' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-faint">{event.teamPrefix} ·</span>
                    <span className="display truncate text-xl text-bone">{m.opponent}</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                    {m.competition ?? m.game ?? ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${statusStyle[m.status]}`}
                  >
                    {m.status === 'LIVE' && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    )}
                    {m.status}
                  </span>
                  <span className="font-mono text-[11px] text-bone-dim">{fmt(m.startsAt)}</span>
                </div>
              </div>
            ))}
            {matches.length === 0 && (
              <p className="px-5 py-10 font-mono text-sm text-faint">
                No fixtures yet — add some in /admin.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </Container>
  )
}
