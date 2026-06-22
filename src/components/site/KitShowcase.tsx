import { Reveal, RevealItem, RevealStagger } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { Container, SectionHeading } from '@/components/ui'

// The 2026/27 kit showcase + sponsor wall. Each jersey is rendered in pure CSS
// (no image asset needed) from its two colours — a clean broadcast "kit card"
// with a collar, centre stripe and number block. Data is admin-driven (Homepage
// global → kits[] / sponsors[]), with family defaults supplied by the reader.

interface Kit {
  org: string
  kitName: string
  primary: string
  secondary: string
}

function Jersey({ primary, secondary }: { primary: string; secondary: string }) {
  // Stylised front-of-shirt: body in secondary (kit white), shoulders + stripe in
  // primary (electric blue), faux number in primary.
  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(160deg, ${secondary}, color-mix(in srgb, ${secondary} 78%, #000))` }}
    >
      {/* shoulder yokes */}
      <div
        className="absolute left-0 top-0 h-1/3 w-1/2 [clip-path:polygon(0_0,100%_0,40%_100%,0_70%)]"
        style={{ background: primary }}
      />
      <div
        className="absolute right-0 top-0 h-1/3 w-1/2 [clip-path:polygon(0_0,100%_0,100%_70%,60%_100%)]"
        style={{ background: primary }}
      />
      {/* collar */}
      <div
        className="absolute left-1/2 top-0 h-7 w-16 -translate-x-1/2 rounded-b-full"
        style={{ background: `color-mix(in srgb, ${primary} 70%, #000)` }}
      />
      {/* centre stripe */}
      <div
        className="absolute bottom-0 left-1/2 top-1/3 w-1.5 -translate-x-1/2 opacity-70"
        style={{ background: primary }}
      />
      {/* number */}
      <span
        className="display absolute inset-x-0 bottom-5 text-center text-5xl"
        style={{ color: primary, opacity: 0.9 }}
      >
        07
      </span>
    </div>
  )
}

export function KitShowcase({
  kicker,
  title,
  kits,
  sponsors,
}: {
  kicker: string
  title: string
  kits: Kit[]
  sponsors: string[]
}) {
  if (!kits.length) return null
  return (
    <Container className="pt-28">
      <Reveal>
        <SectionHeading kicker={kicker} title={title} index={`${kits.length} kits`} />
      </Reveal>

      <RevealStagger
        stagger={0.1}
        className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {kits.map((kit, i) => (
          <RevealItem key={kit.org + i} className="h-full">
            <TiltCard
              accent={kit.primary}
              className="group relative h-full overflow-hidden rounded-2xl border border-line bg-raise/40 p-8"
            >
              <div
                aria-hidden
                className="kit-mesh pointer-events-none absolute inset-0 opacity-50"
                style={{ ['--kit-primary' as string]: kit.primary }}
              />
              <div className="relative">
                <Jersey primary={kit.primary} secondary={kit.secondary} />
                <div className="mt-7 text-center">
                  <h3 className="display text-3xl text-bone">{kit.org}</h3>
                  {kit.kitName && (
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                      {kit.kitName}
                    </p>
                  )}
                </div>
              </div>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealStagger>

      {/* SPONSOR WALL */}
      {sponsors.length > 0 && (
        <Reveal>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-2xl border border-line bg-ink-2/40 px-8 py-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              Backed by
            </span>
            {sponsors.map((s) => (
              <span
                key={s}
                className="font-display text-lg uppercase tracking-wide text-bone-dim transition-colors hover:text-bone"
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      )}
    </Container>
  )
}
