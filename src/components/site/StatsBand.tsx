import { CountUp } from '@/components/motion/CountUp'
import { Reveal } from '@/components/motion/Reveal'
import { Container } from '@/components/ui'

type Stat = { label: string; value: number; compact?: boolean }

// Broadcast stat strip — hairline-divided counters that tick up on scroll.
export function StatsBand({
  members,
  orgs,
  games,
  reach,
  labels,
}: {
  members: number
  orgs: number
  games: number
  reach: number
  labels: { members: string; orgs: string; titles: string; reach: string }
}) {
  const stats: Stat[] = [
    { label: labels.members, value: members },
    { label: labels.orgs, value: orgs },
    { label: labels.titles, value: games },
    { label: labels.reach, value: reach, compact: true },
  ]

  return (
    <Container className="pt-28">
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-ink p-7">
              <div className="display text-5xl text-bone sm:text-6xl">
                <CountUp to={s.value} compact={s.compact} />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </Container>
  )
}
