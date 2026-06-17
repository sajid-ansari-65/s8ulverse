import { CountUp } from '@/components/motion/CountUp'
import { Reveal } from '@/components/motion/Reveal'
import { Container } from '@/components/ui'

type Stat = { label: string; value: number; compact?: boolean; override?: string }

// Broadcast stat strip — hairline-divided counters that tick up on scroll.
// Each value auto-counts from live content unless an admin override string is
// set (e.g. "20+", "13M"), in which case it's shown verbatim.
export function StatsBand({
  members,
  orgs,
  titles,
  reach,
  labels,
  overrides,
}: {
  members: number
  orgs: number
  titles: number
  reach: number
  labels: { members: string; orgs: string; titles: string; reach: string }
  overrides?: { members?: string; orgs?: string; titles?: string; reach?: string }
}) {
  const stats: Stat[] = [
    { label: labels.members, value: members, override: overrides?.members },
    { label: labels.orgs, value: orgs, override: overrides?.orgs },
    { label: labels.titles, value: titles, override: overrides?.titles },
    { label: labels.reach, value: reach, compact: true, override: overrides?.reach },
  ]

  return (
    <Container className="pt-28">
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-ink p-7">
              <div className="display text-5xl text-bone sm:text-6xl">
                {s.override?.trim() ? s.override : <CountUp to={s.value} compact={s.compact} />}
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
