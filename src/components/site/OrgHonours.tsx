import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { PlacementPill, WinnerAvatars } from '@/components/site/honours'
import { Pill, SectionHeading } from '@/components/ui'
import { asGame, type Achievement } from '@/lib/types'

// The org's silverware wall (D-I1) — a trophy-cabinet grid of TEAM honours (C-D1;
// individual honours live on player pages). Each card leads with the placement
// badge and shows the winning roster's avatars (D-I2). Returns null when empty so
// the page omits the section + sub-nav chip.
export function OrgHonours({ honours, accent }: { honours: Achievement[]; accent: string }) {
  if (!honours.length) return null

  return (
    <section id="honours" className="scroll-mt-24 pt-24">
      <SectionHeading kicker="Silverware" title="Honours" index={`${honours.length} titles`} />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {honours.map((a, i) => {
          const game = asGame(a.game ?? null)
          return (
            <Reveal key={a.slug} delay={(i % 3) * 0.06}>
              <TiltCard
                accent={accent}
                className="flex h-full flex-col rounded-2xl border border-line bg-raise/50 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  {a.placement ? (
                    <PlacementPill placement={a.placement} />
                  ) : (
                    <Pill variant="ghost">Award</Pill>
                  )}
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                    {a.year}
                  </span>
                </div>

                <h3 className="display mt-4 text-3xl text-bone">{a.title}</h3>

                {(game || a.category) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {game && <Pill variant="ghost">{game.name}</Pill>}
                    {a.category && <Pill variant="ghost">{a.category}</Pill>}
                  </div>
                )}

                {a.description && (
                  <p className="mt-4 text-sm leading-relaxed text-bone-dim line-clamp-3">
                    {a.description}
                  </p>
                )}

                <div className="mt-5 flex-1" />
                <WinnerAvatars members={a.members} accent={accent} />
              </TiltCard>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
