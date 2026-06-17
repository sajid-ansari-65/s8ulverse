import Link from 'next/link'
import { Suspense } from 'react'

import { Hero } from '@/components/site/Hero'
import { StatsBand } from '@/components/site/StatsBand'
import { EwcSection } from '@/components/site/EwcSection'
import { LiveNowSection } from '@/components/site/LiveNowSection'
import { OrgsGrid } from '@/components/site/OrgsGrid'
import { RosterGrid } from '@/components/site/RosterGrid'
import { Reveal } from '@/components/motion/Reveal'
import { Container } from '@/components/ui'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  getAllOrgs,
  getFeaturedEvent,
  getFeaturedMembers,
  getHomepage,
  getNavigation,
  getRosterStats,
  getSiteSettings,
  getUpcomingMatches,
} from '@/lib/data'

export const revalidate = 3600

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// Section heading with a "view all" link — used for the homepage teasers that
// point into the dedicated pages.
function TeaserHeading({
  kicker,
  title,
  href,
  cta,
}: {
  kicker: string
  title: string
  href: string
  cta: string
}) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-line pb-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">{kicker}</p>
        <h2 className="display mt-3 text-4xl text-bone sm:text-6xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="group shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim transition-colors hover:text-ember"
      >
        {cta}{' '}
        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const [orgs, members, stats, matches, home, event, site, nav] = await Promise.all([
    getAllOrgs(),
    getFeaturedMembers(),
    getRosterStats(),
    getUpcomingMatches(),
    getHomepage(),
    getFeaturedEvent(),
    getSiteSettings(),
    getNavigation(),
  ])
  const orgNames = orgs.length ? orgs.map((o) => o.shortName ?? o.name) : site.familyOrgs

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: site.siteName,
              url: siteUrl,
              description: site.seo.metaDescription,
            },
            {
              '@type': 'SportsOrganization',
              '@id': `${siteUrl}/#s8ul`,
              name: site.schema.orgName,
              alternateName: site.schema.alternateNames,
              url: siteUrl,
              sport: 'Esports',
              location: { '@type': 'Place', name: site.schema.location },
              sameAs: nav.social.map((s) => s.url).filter(Boolean),
            },
            {
              '@type': 'ItemList',
              name: 'Featured roster',
              itemListElement: members.map((m, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${siteUrl}/players/${m.slug}`,
                name: m.ign,
              })),
            },
          ],
        }}
      />

      <Hero
        orgs={orgNames}
        memberCount={stats.members}
        content={{
          heroEyebrow: home.heroEyebrow,
          heroHeadline: home.heroHeadline,
          heroGhostText: home.heroGhostText,
          heroSubtitle: home.heroSubtitle,
          heroCtaLabel: home.heroCtaLabel,
          heroCtaHref: home.heroCtaHref,
        }}
      />

      {/* Streamed: the YouTube live-check is slow + external, so it must not
          block the page's first paint. Renders nothing until someone is live. */}
      <Suspense fallback={null}>
        <LiveNowSection />
      </Suspense>

      <StatsBand
        members={stats.members}
        orgs={stats.orgs}
        titles={stats.titles}
        reach={stats.reach}
        labels={{
          members: home.statMembersLabel,
          orgs: home.statOrgsLabel,
          titles: home.statTitlesLabel,
          reach: home.statReachLabel,
        }}
        overrides={{
          members: home.statMembersValue,
          orgs: home.statOrgsValue,
          titles: home.statTitlesValue,
          reach: home.statReachValue,
        }}
      />

      <EwcSection matches={matches} event={event} />

      {/* ORGS TEASER */}
      <Container className="pt-28">
        <Reveal>
          <TeaserHeading
            kicker={home.orgsKicker}
            title={home.orgsTitle}
            href="/orgs"
            cta="All orgs"
          />
        </Reveal>
        <OrgsGrid orgs={orgs} />
      </Container>

      {/* ROSTER TEASER */}
      <Container className="pt-28">
        <Reveal>
          <TeaserHeading
            kicker={home.rosterKicker}
            title={home.rosterTitle}
            href="/players"
            cta="Full roster"
          />
        </Reveal>
        <RosterGrid members={members} />
      </Container>

      {/* CLOSING CTA */}
      <Container className="pt-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-raise/40 px-8 py-16 text-center sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(60% 80% at 50% 0%, rgba(255,106,42,0.18), transparent 60%)',
              }}
            />
            <p className="relative font-mono text-[11px] uppercase tracking-kicker text-ember">
              {home.ctaEyebrow}
            </p>
            <h2 className="relative mx-auto mt-5 max-w-3xl text-balance display text-5xl leading-[0.95] text-bone sm:text-7xl">
              {home.ctaTitle}
            </h2>
            <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em]">
              <Link
                href={home.ctaPrimaryHref}
                className="rounded-full bg-ember px-6 py-3 text-ink transition-transform hover:scale-105"
              >
                {home.ctaPrimaryLabel}
              </Link>
              <Link
                href={home.ctaSecondaryHref}
                className="rounded-full border border-line px-6 py-3 text-bone-dim transition-colors hover:text-bone"
              >
                {home.ctaSecondaryLabel}
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </>
  )
}
