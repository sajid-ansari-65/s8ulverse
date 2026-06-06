import type { Metadata } from 'next'

import { EwcSection } from '@/components/site/EwcSection'
import { PageHero } from '@/components/site/PageHero'
import { getFeaturedEvent, getPageIntros, getUpcomingMatches } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'EWC 2026',
  description:
    'The road to the Esports World Cup 2026 — live countdown and the S8UL-family match schedule.',
  alternates: { canonical: '/ewc' },
}

export default async function EwcPage() {
  const [matches, event, intros] = await Promise.all([
    getUpcomingMatches(),
    getFeaturedEvent(),
    getPageIntros(),
  ])

  return (
    <>
      <PageHero
        kicker={intros.ewc.kicker}
        title={event.title}
        subtitle={intros.ewc.subtitle}
        ghost={event.title}
      />
      <EwcSection matches={matches} event={event} />
      <div className="pb-32" />
    </>
  )
}
