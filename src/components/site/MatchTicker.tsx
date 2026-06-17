// Broadcast-style results + schedule strip. A continuous marquee of season
// moments — championships (gold), live matches (red pulse) and upcoming fixtures
// (kit blue). Pure CSS marquee, so this stays a server component. Items are built
// on the homepage from real Matches/Achievements/FeaturedEvent data (admin-driven).

export type TickerStatus = 'champion' | 'live' | 'upcoming'

export interface TickerItem {
  label: string
  sub?: string
  status: TickerStatus
}

const dot: Record<TickerStatus, string> = {
  champion: 'bg-accent-metal',
  live: 'bg-red-500 animate-livepulse',
  upcoming: 'bg-accent',
}

const tag: Record<TickerStatus, string> = {
  champion: 'text-accent-metal',
  live: 'text-red-400',
  upcoming: 'text-accent',
}

const tagLabel: Record<TickerStatus, string> = {
  champion: 'Champions',
  live: 'Live',
  upcoming: 'Upcoming',
}

function Row({ items }: { items: TickerItem[] }) {
  return (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3 whitespace-nowrap">
          <span className={`h-2 w-2 rounded-full ${dot[it.status]}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone">
            {it.label}
          </span>
          {it.sub && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {it.sub}
            </span>
          )}
          <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${tag[it.status]}`}>
            {tagLabel[it.status]}
          </span>
          <span className="text-faint">✦</span>
        </span>
      ))}
    </div>
  )
}

export function MatchTicker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null
  return (
    <div className="relative border-y border-line bg-ink-2/60 py-3 backdrop-blur mask-fade-x">
      <div className="flex w-max animate-marquee items-center">
        <Row items={items} />
        <Row items={items} />
      </div>
    </div>
  )
}
