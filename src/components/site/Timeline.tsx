import { Reveal } from '@/components/motion/Reveal'
import { Container, Pill, SectionHeading } from '@/components/ui'

type Achievement = {
  id: string | number
  year: string
  title: string
  description?: string | null
  category?: string | null
}

// Vertical milestone timeline with a brand-gradient spine. Pass `heading` to
// show a section header; omit it when a PageHero already titles the page.
export function Timeline({
  achievements,
  heading,
}: {
  achievements: Achievement[]
  heading?: { kicker: string; title: string; index?: string }
}) {
  if (!achievements.length) return null

  return (
    <Container className={heading ? 'pt-28' : 'pt-12'}>
      {heading && (
        <Reveal>
          <SectionHeading kicker={heading.kicker} title={heading.title} index={heading.index} />
        </Reveal>
      )}

      <div className="relative mt-12 pl-9 sm:pl-12">
        {/* gradient spine */}
        <div className="absolute bottom-2 left-0 top-2 w-px bg-gradient-to-b from-brand-blue via-brand-lime to-brand-orange" />

        <div className="space-y-10">
          {achievements.map((a, i) => (
            <Reveal key={a.id} delay={(i % 6) * 0.05}>
              <div className="relative">
                <span className="absolute -left-9 top-[10px] h-2.5 w-2.5 rounded-full bg-ember ring-4 ring-ink sm:-left-12" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="display shrink-0 text-3xl text-bone/35 sm:w-24">{a.year}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="display text-2xl text-bone sm:text-3xl">{a.title}</h3>
                      {a.category && <Pill variant="ghost">{a.category}</Pill>}
                    </div>
                    {a.description && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
                        {a.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  )
}
