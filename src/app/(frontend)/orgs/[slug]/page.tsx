import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Reveal } from '@/components/motion/Reveal'
import { Parallax } from '@/components/motion/Parallax'
import { LegacyRoster } from '@/components/site/LegacyRoster'
import { OrgHonours } from '@/components/site/OrgHonours'
import { JsonLd } from '@/components/seo/JsonLd'
import { Container, Initial, Pill } from '@/components/ui'
import { getAllOrgSlugs, getOrgAchievements, getOrgBySlug, getOrgRoster } from '@/lib/data'
import { groupRoster, memberHonourMap, splitHonours } from '@/lib/roster'
import { kitVars, mediaUrl, orgKit } from '@/lib/types'

export const revalidate = 3600
export const dynamicParams = true

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateStaticParams() {
  const slugs = await getAllOrgSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrgBySlug(slug)
  if (!org) return {}

  const title = `${org.name} — Roster, Honours & Partnerships`
  const description =
    org.description ?? `${org.name} — the full roster, every era and every trophy.`

  // og:image comes from the sibling opengraph-image.tsx — don't set it here.
  return {
    title,
    description,
    keywords: [org.name, org.shortName, 'roster', 'legacy', 'honours', 'S8ULverse']
      .filter(Boolean)
      .join(', '),
    alternates: { canonical: `/orgs/${org.slug}` },
    openGraph: { title, description, type: 'website', url: `/orgs/${org.slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await getOrgBySlug(slug)
  if (!org) notFound()

  const [roster, orgAch] = await Promise.all([getOrgRoster(org.id), getOrgAchievements(org.id)])

  // The org's 2026/27 kit drives the whole page (--kit-* via the wrapper below);
  // `accent` (= kit primary) is still passed to roster/honours components.
  const kit = orgKit(org)
  const accent = kit.primary
  const banner = mediaUrl(org.banner)
  const logo = mediaUrl(org.logo)

  const { current, alumni, staff, owners } = groupRoster(roster)
  const players = { current, alumni }
  const staffGroups = {
    current: staff.filter((s) => s.isCurrent),
    alumni: staff.filter((s) => !s.isCurrent),
  }
  const honourMap = memberHonourMap(orgAch)
  const { team: teamHonours } = splitHonours(orgAch)

  const socials = [
    { label: 'website', url: org.website },
    { label: 'twitter', url: org.twitter },
    { label: 'instagram', url: org.instagram },
    { label: 'youtube', url: org.youtube },
  ].filter((s): s is { label: string; url: string } => Boolean(s.url))

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SportsOrganization',
              '@id': `${siteUrl}/orgs/${org.slug}#org`,
              name: org.name,
              alternateName: org.shortName ?? undefined,
              description: org.description ?? undefined,
              foundingDate: org.founded ? String(org.founded) : undefined,
              url: `${siteUrl}/orgs/${org.slug}`,
              logo: logo ?? undefined,
              sameAs: socials.map((s) => s.url),
              member: [...current, ...alumni].map((p) => ({
                '@type': 'Person',
                name: p.member.ign,
                url: `${siteUrl}/players/${p.member.slug}`,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'S8ULverse', item: siteUrl },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Organizations',
                  item: `${siteUrl}/orgs`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: org.name,
                  item: `${siteUrl}/orgs/${org.slug}`,
                },
              ],
            },
          ],
        }}
      />

      {/* Everything below is themed to this org's kit via --kit-* vars. */}
      <div style={kitVars(kit)}>
      {/* CINEMATIC HEADER */}
      <header className="relative min-h-[72svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          {/* Only the backdrop image drifts (parallax); overlays stay fixed so the
              text stays readable and edges never show. scale-110 = travel headroom. */}
          <Parallax speed={50} className="absolute inset-0">
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="h-full w-full scale-110 object-cover" />
            ) : (
              <div
                className="h-full w-full scale-110"
                style={{
                  background: `radial-gradient(80% 80% at 70% 10%, ${accent}33, transparent 55%), radial-gradient(60% 60% at 0% 100%, ${accent}22, transparent 50%), #0a0a0e`,
                }}
              />
            )}
          </Parallax>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
          <div aria-hidden className="jersey-stripe absolute inset-0 opacity-30 mask-fade-b" />
          <div aria-hidden className="grain absolute inset-0" />
        </div>

        <span className="display text-stroke pointer-events-none absolute -right-4 top-24 hidden whitespace-nowrap text-[20vw] leading-none opacity-[0.07] lg:block">
          {org.shortName ?? org.name}
        </span>

        <Container className="relative z-10 flex min-h-[72svh] items-end pb-14">
          <div className="flex w-full flex-col gap-8 md:flex-row md:items-end">
            <div
              className="frame relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl bg-ink ring-1 ring-line"
              style={{ boxShadow: `0 30px 80px -20px ${accent}66` }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={org.name} className="h-full w-full object-contain p-5" />
              ) : (
                <Initial label={org.shortName ?? org.name} accent={accent} className="h-full w-full" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {org.isVerified && <Pill variant="solid">Verified</Pill>}
                {org.founded && <Pill variant="ghost">Founded {org.founded}</Pill>}
                <Pill variant="ember">{current.length} active</Pill>
                {teamHonours.length > 0 && (
                  <Pill variant="ghost">{teamHonours.length} titles</Pill>
                )}
              </div>
              <h1 className="display mt-4 text-[15vw] leading-[0.84] text-bone sm:text-8xl">
                {org.name}
              </h1>
              {org.shortName && org.shortName !== org.name && (
                <p className="mt-2 text-xl text-bone-dim">{org.shortName}</p>
              )}

              {socials.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bone-dim transition-colors hover:text-accent"
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* Sticky anchor sub-nav (D-G1) */}
      <div className="sticky top-0 z-20 border-y border-line bg-ink/85 backdrop-blur">
        <Container>
          <nav className="flex gap-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em]">
            <a href="#roster" className="text-bone-dim transition-colors hover:text-accent">
              Roster
            </a>
            {teamHonours.length > 0 && (
              <a href="#honours" className="text-bone-dim transition-colors hover:text-accent">
                Honours
              </a>
            )}
          </nav>
        </Container>
      </div>

      <Container className="pb-24 pt-16">
        <Link
          href="/orgs"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-bone"
        >
          ← All organizations
        </Link>

        {org.description && (
          <Reveal className="mt-10">
            <p className="max-w-4xl font-display text-3xl leading-[1.15] text-bone/90 sm:text-4xl">
              {org.description}
            </p>
          </Reveal>
        )}

        {owners.length > 0 && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Led by{' '}
            {owners.map((o, i) => (
              <span key={o.member.id}>
                {i > 0 && ' · '}
                <Link
                  href={`/players/${o.member.slug}`}
                  className="text-bone-dim transition-colors hover:text-accent"
                >
                  {o.member.ign}
                </Link>
              </span>
            ))}
          </p>
        )}

        <LegacyRoster
          players={players}
          staff={staffGroups}
          honourMap={honourMap}
          accent={accent}
        />

        <OrgHonours honours={teamHonours} accent={accent} />
      </Container>
      </div>
    </>
  )
}
