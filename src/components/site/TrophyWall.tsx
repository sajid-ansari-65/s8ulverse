import Link from 'next/link'

import { Reveal } from '@/components/motion/Reveal'
import { Container, Pill, SectionHeading } from '@/components/ui'

// Cinematic championship cabinet. The most recent title (achievements are sorted
// -sortKey upstream) leads as a hero card with gold-foil type; the rest form a
// dense honours grid. Data comes from getAchievements() — fully admin-driven.

export interface TrophyItem {
  id: string | number
  year: string
  title: string
  description?: string | null
  category?: string | null
}

export function TrophyWall({
  achievements,
  kicker = 'The cabinet',
  title = 'Honours',
}: {
  achievements: TrophyItem[]
  kicker?: string
  title?: string
}) {
  if (!achievements.length) return null
  const [hero, ...rest] = achievements

  return (
    <Container className="pt-28">
      <Reveal>
        <SectionHeading kicker={kicker} title={title} index={`${achievements.length} titles`} />
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* HERO TROPHY */}
        <Reveal scale blur>
          <div className="frame relative h-full overflow-hidden rounded-3xl border border-accent-metal/25 bg-raise/40 p-8 sm:p-10">
            <div aria-hidden className="kit-mesh pointer-events-none absolute inset-0 opacity-60" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-metal/15 blur-3xl"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant="metal">★ Latest title</Pill>
                {hero.category && <Pill variant="ghost">{hero.category}</Pill>}
                <Pill variant="ghost">{hero.year}</Pill>
              </div>
              <h3 className="display metal-text animate-foil mt-6 text-5xl leading-[0.92] sm:text-7xl">
                {hero.title}
              </h3>
              {hero.description && (
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-bone-dim">
                  {hero.description}
                </p>
              )}
              <Link
                href="/achievements"
                className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim transition-colors hover:text-accent-metal"
              >
                Full honours <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* GRID OF THE REST */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rest.slice(0, 8).map((a, i) => (
            <Reveal key={a.id} delay={(i % 2) * 0.05}>
              <div className="group h-full rounded-2xl border border-line bg-raise/40 p-5 transition-colors hover:border-accent/40">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-metal">
                  {a.year}
                </p>
                <h4 className="mt-2 text-base font-semibold leading-snug text-bone">{a.title}</h4>
                {a.category && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                    {a.category}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  )
}
