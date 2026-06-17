import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Reveal } from '@/components/motion/Reveal'
import { CareerTimeline } from '@/components/site/CareerTimeline'
import { TenureTimeline } from '@/components/site/TenureTimeline'
import { SocialPresence } from '@/components/site/SocialPresence'
import { YouTubeContent } from '@/components/site/YouTubeContent'
import { InstagramFeed } from '@/components/site/InstagramFeed'
import { ProfileTabs, type ProfileTab } from '@/components/site/ProfileTabs'
import { Container, Initial, Pill } from '@/components/ui'
import { JsonLd } from '@/components/seo/JsonLd'
import { getAllMemberSlugs, getMemberBySlug, getMemberTenures, getYouTubeChannels } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { asOrg, mediaUrl } from '@/lib/types'

export const revalidate = 3600
export const dynamicParams = true

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateStaticParams() {
  const slugs = await getAllMemberSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const member = await getMemberBySlug(slug)
  if (!member) return {}

  const org = asOrg(member.org)
  const title =
    member.metaTitle ??
    `${member.ign}${member.realName ? ` (${member.realName})` : ''}${org ? ` — ${org.name}` : ''}`
  const description =
    member.metaDesc ??
    member.bio ??
    `${member.ign} — ${member.role.toLowerCase()}${org ? ` at ${org.name}` : ''}.`

  // og:image is supplied by the sibling opengraph-image.tsx (branded card) —
  // don't set openGraph.images here or it overrides that.
  return {
    title,
    description,
    keywords: [member.ign, member.realName, org?.name, member.role, member.position, 'S8ULverse']
      .filter(Boolean)
      .join(', '),
    alternates: { canonical: `/players/${member.slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/players/${member.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const member = await getMemberBySlug(slug)
  if (!member) notFound()

  const org = asOrg(member.org)
  const accent = org?.accentHex ?? '#ff5a36'
  const avatar = mediaUrl(member.avatar)
  const banner = mediaUrl(member.banner)

  // YouTube — one or more channels (switcher) + admin-curated Instagram posts.
  const [ytChannels, tenures] = await Promise.all([
    getYouTubeChannels(member),
    getMemberTenures(member.id),
  ])
  const igPosts = (member.instagramPosts ?? []).map((p) => p.url).filter(Boolean)

  // Profile sections are presented as tabs — only those with content appear.
  const profileTabs: ProfileTab[] = []
  // Factual multi-org stint history (every era, both orgs for shared players).
  if (tenures.length > 0) {
    profileTabs.push({
      key: 'career',
      label: 'Career',
      content: <TenureTimeline tenures={tenures} bare />,
    })
  }
  if ((member.career ?? []).length > 0) {
    profileTabs.push({
      key: 'journey',
      label: 'Journey',
      content: <CareerTimeline career={member.career ?? []} bare />,
    })
  }
  if (ytChannels.length > 0) {
    profileTabs.push({
      key: 'channel',
      label: 'Channel',
      content: <YouTubeContent channels={ytChannels} bare />,
    })
  }
  if (igPosts.length > 0) {
    profileTabs.push({
      key: 'instagram',
      label: 'Instagram',
      content: <InstagramFeed posts={igPosts} bare />,
    })
  }
  if ((member.socials ?? []).length > 0) {
    profileTabs.push({
      key: 'social',
      label: 'Social',
      content: <SocialPresence socials={member.socials ?? []} bare />,
    })
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': `${siteUrl}/players/${member.slug}#person`,
              name: member.realName ?? member.ign,
              alternateName: member.ign,
              description: member.bio ?? undefined,
              jobTitle: [member.role, member.position].filter(Boolean).join(' · ') || undefined,
              memberOf: org ? { '@type': 'SportsOrganization', name: org.name } : undefined,
              nationality: member.country ?? undefined,
              url: `${siteUrl}/players/${member.slug}`,
              image: avatar ?? undefined,
              sameAs: (member.socials ?? []).map((s) => s.url),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'S8ULverse', item: siteUrl },
                { '@type': 'ListItem', position: 2, name: 'Players', item: `${siteUrl}/#roster` },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: member.ign,
                  item: `${siteUrl}/players/${member.slug}`,
                },
              ],
            },
          ],
        }}
      />

      {/* CINEMATIC HEADER */}
      <header className="relative min-h-[78svh] w-full overflow-hidden">
        {/* backdrop */}
        <div className="absolute inset-0">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(80% 80% at 70% 10%, ${accent}33, transparent 55%), radial-gradient(60% 60% at 0% 100%, ${accent}22, transparent 50%), #0a0a0e`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
        </div>

        {/* ghost IGN */}
        <span className="display text-stroke pointer-events-none absolute -right-4 top-24 hidden whitespace-nowrap text-[20vw] leading-none opacity-[0.07] lg:block">
          {member.ign}
        </span>

        <Container className="relative z-10 flex min-h-[78svh] items-end pb-14">
          <div className="flex w-full flex-col gap-8 md:flex-row md:items-end">
            {/* portrait */}
            <div
              className="frame relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line"
              style={{ boxShadow: `0 30px 80px -20px ${accent}66` }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={member.ign} className="h-full w-full object-cover" />
              ) : (
                <Initial label={member.ign} accent={accent} className="h-full w-full" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant="ember">{member.role}</Pill>
                {member.position && <Pill variant="ghost">{member.position}</Pill>}
                {member.isVerified && <Pill variant="solid">Verified</Pill>}
                {org && <Pill variant="ghost">{org.name}</Pill>}
              </div>
              <h1 className="display mt-4 text-[16vw] leading-[0.84] text-bone sm:text-8xl">
                {member.ign}
              </h1>
              {member.realName && (
                <p className="mt-2 text-xl text-bone-dim">{member.realName}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                {member.joinedAt && <span>Active since {formatDate(member.joinedAt)}</span>}
                {member.country && <span>{member.country}</span>}
                {(member.socials ?? []).map((s, i) => (
                  <a
                    key={s.id ?? i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bone-dim transition-colors hover:text-ember"
                  >
                    {s.platform.toLowerCase()} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Container className="pt-16">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-bone"
        >
          ← Back to roster
        </Link>

        {member.bio && (
          <Reveal className="mt-10">
            <p className="max-w-4xl font-display text-3xl leading-[1.15] text-bone/90 sm:text-4xl">
              {member.bio}
            </p>
          </Reveal>
        )}

        {profileTabs.length > 0 && <ProfileTabs tabs={profileTabs} />}
      </Container>
    </>
  )
}
