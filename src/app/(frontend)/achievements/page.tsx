import type { Metadata } from 'next'

import { PageHero } from '@/components/site/PageHero'
import { Timeline } from '@/components/site/Timeline'
import { getAchievements, getPageIntros } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Honours',
  description:
    'Titles, trophies and milestones of the S8UL family — from Content Group of the Year to the biggest stages in esports.',
  alternates: { canonical: '/achievements' },
}

export default async function AchievementsPage() {
  const [achievements, intros] = await Promise.all([getAchievements(), getPageIntros()])
  const intro = intros.achievements

  return (
    <>
      <PageHero
        kicker={intro.kicker}
        title={intro.title}
        subtitle={intro.subtitle}
        ghost={intro.title.toUpperCase()}
      />
      <Timeline achievements={achievements} />
      <div className="pb-32" />
    </>
  )
}
