import { Container } from '@/components/ui'

// Slim cinematic header for interior pages — a lighter counterpart to the
// homepage Hero. Ghost wordmark + aurora wash keep the broadcast feel.
export function PageHero({
  kicker,
  title,
  subtitle,
  ghost,
}: {
  kicker: string
  title: string
  subtitle?: string
  ghost?: string
}) {
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[8%] top-[12%] h-[34vw] w-[34vw] animate-aurora rounded-full bg-brand-blue/15 blur-[100px]" />
        <div className="absolute right-[2%] top-[6%] h-[28vw] w-[28vw] animate-aurora rounded-full bg-brand-orange/15 blur-[100px] [animation-delay:-7s]" />
      </div>

      {ghost && (
        <span className="display text-stroke pointer-events-none absolute -right-4 top-20 hidden whitespace-nowrap text-[16vw] leading-none opacity-[0.06] lg:block">
          {ghost}
        </span>
      )}

      <Container className="relative">
        <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">{kicker}</p>
        <h1 className="display mt-4 text-6xl leading-[0.9] text-bone sm:text-8xl">{title}</h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bone-dim">{subtitle}</p>
        )}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-line via-line to-transparent" />
      </Container>
    </section>
  )
}
