import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { Pill } from '@/components/ui'
import type { Org } from '@/lib/types'

// Organizations grid — the first card spans wide with a conic-gradient glow.
// Shared by the homepage teaser and the full /orgs page.
export function OrgsGrid({ orgs }: { orgs: Org[] }) {
  if (orgs.length === 0) {
    return (
      <p className="mt-10 font-mono text-sm text-faint">
        No organizations yet — add some in /admin and they’ll light up here.
      </p>
    )
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {orgs.map((org, i) => {
        const accent = org.accentHex ?? '#ff5a36'
        const featured = i === 0
        return (
          <Reveal key={org.id} delay={i * 0.06} className={featured ? 'lg:col-span-2' : ''}>
            <div className="relative h-full">
              {featured && (
                <div
                  aria-hidden
                  className="absolute -inset-2 animate-spin-slow rounded-[20px] opacity-50 blur-xl"
                  style={{
                    background: 'conic-gradient(from 0deg, #0a6ad6, #c2e23f, #ff6a2a, #0a6ad6)',
                  }}
                />
              )}
              <TiltCard
                accent={accent}
                className={`relative h-full rounded-2xl border border-line p-7 backdrop-blur-sm ${
                  featured ? 'bg-ink/85' : 'bg-raise/50'
                }`}
              >
                <span
                  className="block h-1 w-14 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <div className="mt-6 flex items-start justify-between gap-3">
                  <h3
                    className={`display ${
                      featured ? 'text-6xl sm:text-7xl' : 'text-5xl'
                    } text-bone`}
                  >
                    {org.name}
                  </h3>
                  {org.isVerified && <Pill variant="ember">Verified</Pill>}
                </div>
                {org.description && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone-dim line-clamp-3">
                    {org.description}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                  {org.shortName && <span>{org.shortName}</span>}
                  {org.founded && <span>Est. {org.founded}</span>}
                </div>
              </TiltCard>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
