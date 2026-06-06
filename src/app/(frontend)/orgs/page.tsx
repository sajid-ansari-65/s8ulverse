import type { Metadata } from 'next'

import { OrgsGrid } from '@/components/site/OrgsGrid'
import { PageHero } from '@/components/site/PageHero'
import { Container } from '@/components/ui'
import { getAllOrgs, getPageIntros } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Organizations',
  description:
    'The dynasties of the S8UL family — S8UL, Team SouL, 8Bit and 8Bit Creative.',
  alternates: { canonical: '/orgs' },
}

export default async function OrgsPage() {
  const [orgs, intros] = await Promise.all([getAllOrgs(), getPageIntros()])
  const intro = intros.orgs

  return (
    <>
      <PageHero
        kicker={intro.kicker}
        title={intro.title}
        subtitle={intro.subtitle}
        ghost="ORGS"
      />
      <Container className="pb-32 pt-12">
        <OrgsGrid orgs={orgs} />
      </Container>
    </>
  )
}
