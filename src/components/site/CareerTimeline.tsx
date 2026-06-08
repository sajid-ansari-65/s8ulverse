import { Reveal } from '@/components/motion/Reveal'
import type { CareerEntry } from '@/lib/types'

// Per-person journey — from the day they started, oldest → newest.
export function CareerTimeline({
  career,
  bare = false,
}: {
  career: CareerEntry[]
  bare?: boolean
}) {
  if (!career.length) return null

  return (
    <section className={bare ? '' : 'mt-20'}>
      {!bare && (
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">From day one</p>
          <h2 className="display mt-3 text-4xl text-bone">Journey</h2>
        </Reveal>
      )}

      <div className={`relative pl-9 sm:pl-12 ${bare ? '' : 'mt-8'}`}>
        <div className="absolute bottom-2 left-0 top-2 w-px bg-gradient-to-b from-brand-blue via-brand-lime to-brand-orange" />

        <div className="space-y-8">
          {career.map((c, i) => (
            <Reveal key={c.id ?? i} delay={(i % 6) * 0.05}>
              <div className="relative">
                <span className="absolute -left-9 top-[9px] h-2.5 w-2.5 rounded-full bg-ember ring-4 ring-ink sm:-left-12" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="display shrink-0 text-2xl text-bone/35 sm:w-20">{c.year}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-bone">{c.title}</h3>
                    {c.description && (
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-bone-dim">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
