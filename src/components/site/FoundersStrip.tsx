import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { Container, Initial, SectionHeading } from '@/components/ui'

type Founder = {
  id: string | number
  name: string
  alias?: string | null
  role: string
  bio?: string | null
  photo?: { url?: string | null } | string | null
}

const photoUrl = (p: Founder['photo']): string | null =>
  p && typeof p === 'object' ? (p.url ?? null) : null

export function FoundersStrip({
  founders,
  heading,
}: {
  founders: Founder[]
  heading?: { kicker: string; title: string }
}) {
  if (!founders.length) return null

  return (
    <Container className="pt-28">
      <Reveal>
        <SectionHeading
          kicker={heading?.kicker ?? 'The architects'}
          title={heading?.title ?? 'Founders'}
          index="The team"
        />
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {founders.map((f, i) => {
          const img = photoUrl(f.photo)
          return (
            <Reveal key={f.id} delay={(i % 4) * 0.06}>
              <TiltCard
                accent="#ff6a2a"
                className="h-full overflow-hidden rounded-2xl border border-line bg-raise/50"
                max={6}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={f.name} className="h-full w-full object-cover" />
                  ) : (
                    <Initial label={f.alias || f.name} accent="#ff6a2a" className="h-full w-full" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4">
                    {f.alias && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ember">
                        {f.alias}
                      </p>
                    )}
                    <h3 className="display text-2xl text-bone">{f.name}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                    {f.role}
                  </p>
                  {f.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-bone-dim line-clamp-4">{f.bio}</p>
                  )}
                </div>
              </TiltCard>
            </Reveal>
          )
        })}
      </div>
    </Container>
  )
}
