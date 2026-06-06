import type { Metadata } from 'next'

import { FoundersStrip } from '@/components/site/FoundersStrip'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { Container } from '@/components/ui'
import { getFounders, getPageIntros } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story and the architects behind the S8UL family — S8UL, Team SouL, 8Bit and 8Bit Creative.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const [founders, intros] = await Promise.all([getFounders(), getPageIntros()])
  const about = intros.about

  return (
    <>
      <PageHero
        kicker={about.kicker}
        title={about.title}
        subtitle={about.subtitle}
        ghost={about.title.toUpperCase()}
      />

      <Container className="pt-12">
        <Reveal>
          <p className="max-w-4xl font-display text-3xl leading-[1.2] text-bone/90 sm:text-4xl">
            {about.lead}
          </p>
        </Reveal>
        {about.body && (
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-bone-dim">{about.body}</p>
          </Reveal>
        )}
      </Container>

      <FoundersStrip founders={founders} heading={intros.founders} />
      <div className="pb-32" />
    </>
  )
}
