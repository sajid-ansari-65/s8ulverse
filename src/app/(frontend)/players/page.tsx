import type { Metadata } from 'next'

import { PageHero } from '@/components/site/PageHero'
import { RosterGrid } from '@/components/site/RosterGrid'
import { Container } from '@/components/ui'
import { getAllMembers, getPageIntros } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Players & Creators',
  description:
    'The full S8UL-family roster — players, creators, coaches and owners across S8UL, Team SouL, 8Bit and 8Bit Creative.',
  alternates: { canonical: '/players' },
}

export default async function PlayersPage() {
  const [members, intros] = await Promise.all([getAllMembers(), getPageIntros()])
  const intro = intros.players

  return (
    <>
      <PageHero
        kicker={intro.kicker}
        title={intro.title}
        subtitle={intro.subtitle}
        ghost={intro.title.toUpperCase()}
      />
      <Container className="pb-32 pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </p>
        <RosterGrid members={members} />
      </Container>
    </>
  )
}
