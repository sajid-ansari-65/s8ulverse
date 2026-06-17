import { getPayloadClient } from './payload'
import {
  asOrg,
  mediaUrl,
  type Achievement,
  type Brand,
  type Member,
  type Org,
  type RosterMember,
  type Tenure,
} from './types'
import { buildRoster } from './roster'
import { getLiveStatus, getYouTube, type YtData, type YtVideo } from './youtube'

// All public reads go through Payload's Local API. Cache-tag invalidation
// (revalidateTag on admin mutations) is a Phase B refinement; for now pages use
// time-based `revalidate`.

export async function getAllOrgs(): Promise<Org[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'organizations',
    sort: 'name',
    depth: 1,
    limit: 100,
  })
  return docs as unknown as Org[]
}

export async function getOrgBySlug(slug: string): Promise<Org | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'organizations',
    where: { slug: { equals: slug } },
    depth: 1, // populate logo + banner for the org detail header
    limit: 1,
  })
  return (docs[0] as unknown as Org) ?? null
}

export async function getFeaturedMembers(): Promise<Member[]> {
  const payload = await getPayloadClient()
  const base = { collection: 'members' as const, sort: '-createdAt', depth: 1, limit: 8 }

  // Prefer hand-picked featured members; fall back to any active+verified.
  const featured = await payload.find({
    ...base,
    where: { featured: { equals: true }, isActive: { equals: true } },
  })
  if (featured.docs.length) return featured.docs as unknown as Member[]

  const fallback = await payload.find({
    ...base,
    where: { isVerified: { equals: true }, isActive: { equals: true } },
  })
  return fallback.docs as unknown as Member[]
}

export async function getFounders() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'founders',
    sort: 'order',
    depth: 1,
    limit: 20,
  })
  return docs as unknown as Array<{
    id: string | number
    name: string
    alias?: string | null
    role: string
    bio?: string | null
    photo?: { url?: string | null } | string | null
  }>
}

export async function getUpcomingMatches() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'matches',
    where: { status: { not_equals: 'COMPLETED' } },
    sort: 'startsAt',
    depth: 0,
    limit: 8,
  })
  return docs as unknown as Array<{
    id: string | number
    opponent: string
    status: 'LIVE' | 'UPCOMING' | 'COMPLETED'
    competition?: string | null
    game?: string | null
    event?: string | null
    startsAt: string
  }>
}

export async function getAchievements() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'achievements',
    sort: '-sortKey',
    depth: 0,
    limit: 20,
  })
  return docs as unknown as Array<{
    id: string | number
    year: string
    title: string
    description?: string | null
    category?: string | null
  }>
}

// ─── Tenures / legacy rosters ───────────────────────────────────────────────
// NOTE (runtime-verify): the relationship hasMany filters below use the `in`
// operator (`members: { in: [id] }`, `orgs: { in: [orgId] }`) — the expected
// Payload operator. Confirm against live data when the seed lands; if a hasMany
// needs `contains` instead, only these where-clauses change.

// Full roster history for an org (alumni included — no isActive filter). Merges
// each member's stints into one RosterMember (rejoins collapsed).
export async function getOrgRoster(orgId: string | number): Promise<RosterMember[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'tenures',
    where: { org: { equals: orgId } },
    depth: 2, // populate member (+avatar), team, org
    limit: 1000,
    sort: 'joinedAt',
  })
  return buildRoster(docs as unknown as Tenure[])
}

// A single member's tenures across ALL orgs — the profile-page career timeline.
export async function getMemberTenures(memberId: string | number): Promise<Tenure[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'tenures',
    where: { member: { equals: memberId } },
    depth: 2,
    limit: 1000,
    sort: 'joinedAt',
  })
  return docs as unknown as Tenure[]
}

// ─── Achievements (scoped) ──────────────────────────────────────────────────

// Every honour linked to an org — feeds OrgHonours AND the roster-card honour map
// (fetched once, mapped in-app via memberHonourMap — no N+1).
export async function getOrgAchievements(orgId: string | number): Promise<Achievement[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'achievements',
    where: { org: { equals: orgId } },
    sort: '-sortKey',
    depth: 1, // members / game / team
    limit: 200,
  })
  return docs as unknown as Achievement[]
}

// Every honour a member is credited on (all orgs) — player page, split by type.
export async function getMemberAchievements(memberId: string | number): Promise<Achievement[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'achievements',
    where: { members: { in: [memberId] } },
    sort: '-sortKey',
    depth: 1,
    limit: 200,
  })
  return docs as unknown as Achievement[]
}

// ─── Brands / partnerships ──────────────────────────────────────────────────
// Map the stored ACTIVE/PAST enum to the friendly view-model `status`.
function mapBrand(d: unknown): Brand {
  const raw = d as { status?: unknown }
  return { ...(d as Brand), status: raw.status === 'PAST' ? 'Past' : 'Active' }
}

export async function getBrands(): Promise<Brand[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    sort: ['-featured', '-sortKey'],
    depth: 1, // logo, orgs, members, team, game
    limit: 200,
  })
  return docs.map(mapBrand)
}

export async function getBrandsByOrg(orgId: string | number): Promise<Brand[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    where: { orgs: { in: [orgId] } },
    sort: ['-featured', '-sortKey'],
    depth: 1,
    limit: 200,
  })
  return docs.map(mapBrand)
}

export async function getMemberBrands(memberId: string | number): Promise<Brand[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    where: { members: { in: [memberId] } },
    sort: ['-featured', '-sortKey'],
    depth: 1,
    limit: 200,
  })
  return docs.map(mapBrand)
}

export async function getMemberBySlug(slug: string): Promise<Member | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'members',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return (docs[0] as unknown as Member) ?? null
}

export async function getAllMembers(): Promise<Member[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'members',
    where: { isActive: { equals: true } },
    sort: ['-featured', '-isVerified', 'ign'],
    depth: 1,
    limit: 500,
  })
  return docs as unknown as Member[]
}

export async function getAllMemberSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'members',
    depth: 0,
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((d) => (d as { slug: string }).slug)
}

export async function getRosterStats(): Promise<{
  members: number
  orgs: number
  titles: number
  reach: number
}> {
  const payload = await getPayloadClient()
  const [orgs, titles, members] = await Promise.all([
    payload.count({ collection: 'organizations' }),
    // "Titles" = team honours won (F3 — previously a games count mislabelled "Titles").
    payload.count({ collection: 'achievements', where: { type: { equals: 'Team' } } }),
    // Current roster only — the seeded alumni must not skew "Players & creators" or
    // "Combined reach" (F3). Manual StatsBand overrides still win.
    payload.find({
      collection: 'members',
      where: { isActive: { equals: true } },
      depth: 0,
      limit: 1000,
      select: { socials: true },
    }),
  ])
  const reach = members.docs.reduce((sum, m) => {
    const socials = (m as { socials?: Array<{ followers?: number | null }> }).socials
    return sum + (socials?.[0]?.followers ?? 0)
  }, 0)
  return { orgs: orgs.totalDocs, titles: titles.totalDocs, members: members.totalDocs, reach }
}

export async function getAllOrgSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((d) => (d as { slug: string }).slug)
}

// ─── Admin-authored pages ───────────────────────────────────────────────────

export interface PageDoc {
  id: string | number
  title: string
  slug: string
  headerKicker?: string | null
  subtitle?: string | null
  layout?: ({ blockType?: string; id?: string } & Record<string, unknown>)[] | null
  metaTitle?: string | null
  metaDesc?: string | null
}

export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, published: { equals: true } },
    depth: 2, // populate media uploads inside layout blocks
    limit: 1,
  })
  return (docs[0] as unknown as PageDoc) ?? null
}

export async function getAllPageSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { published: { equals: true } },
    depth: 0,
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((d) => (d as { slug: string }).slug)
}

// ─── Editable menus (Navigation global) ─────────────────────────────────────

export interface NavLink {
  label: string
  href: string
}
export interface NavData {
  header: NavLink[]
  footerColumns: { heading: string; links: NavLink[] }[]
  social: { platform: string; url: string }[]
  footerTagline?: string | null
}

// ─── YouTube channels (profile, supports multiple per creator) ──────────────

export interface YtChannel {
  label: string
  data: YtData
}

// Resolves a member's YouTube into one entry per channel. Uses the explicit
// `youtubeChannels` list if present (primary first), else falls back to the
// single YOUTUBE social handle. Each channel is fetched + cached independently.
export async function getYouTubeChannels(member: Member): Promise<YtChannel[]> {
  const explicit = (member.youtubeChannels ?? []).filter((c) => c?.handle)

  let specs: { label: string; handle: string; featured?: string | null }[]
  if (explicit.length) {
    specs = [...explicit]
      .sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)))
      .map((c) => ({
        label: c.label || c.handle,
        handle: c.handle,
        featured: c.featuredVideo ?? (c.primary ? member.featuredYoutubeVideo : null),
      }))
  } else {
    const handle = ytHandleOf(member)
    if (!handle) return []
    specs = [{ label: 'Main', handle, featured: member.featuredYoutubeVideo }]
  }

  const resolved = await Promise.all(
    specs.map(async (s) => {
      const data = await getYouTube(s.handle, s.featured)
      return data ? { label: s.label, data } : null
    }),
  )
  return resolved.filter((c): c is YtChannel => c !== null)
}

// ─── Live now (homepage band) ───────────────────────────────────────────────

export interface LiveCreator {
  slug: string
  ign: string
  avatar: string | null
  accent: string
  org: string | null
  video: YtVideo
  channelUrl: string
}

const ytHandleOf = (m: Member): string | null => {
  const s = (m.socials ?? []).find((x) => x.platform === 'YOUTUBE')
  return s?.handle ?? s?.url?.match(/@([\w.-]+)/)?.[1] ?? null
}

// Scans active members with a YouTube handle and returns those streaming now.
// Cheap per channel (~3 units) + cached 10m in youtube.ts; checks run in parallel.
export async function getLiveCreators(): Promise<LiveCreator[]> {
  const members = await getAllMembers()
  const candidates = members
    .map((m) => ({ m, handle: ytHandleOf(m) }))
    .filter((x): x is { m: Member; handle: string } => Boolean(x.handle))

  const results = await Promise.all(
    candidates.map(async ({ m, handle }) => {
      const status = await getLiveStatus(handle)
      if (!status) return null
      const org = asOrg(m.org)
      return {
        slug: m.slug,
        ign: m.ign,
        avatar: mediaUrl(m.avatar),
        accent: org?.accentHex ?? '#ff5a36',
        org: org?.shortName ?? org?.name ?? null,
        video: status.video,
        channelUrl: status.channelUrl,
      } satisfies LiveCreator
    }),
  )
  return results.filter((r): r is LiveCreator => r !== null)
}

export async function getNavigation(): Promise<NavData> {
  const payload = await getPayloadClient()
  const nav = (await payload.findGlobal({ slug: 'navigation' })) as unknown as Partial<NavData>
  return {
    header: nav.header ?? [],
    footerColumns: nav.footerColumns ?? [],
    social: nav.social ?? [],
    footerTagline: nav.footerTagline ?? null,
  }
}

// ─── Site Settings (brand) ──────────────────────────────────────────────────

export interface SiteSettings {
  siteName: string
  wordmarkSuffix: string
  tagline: string
  location: string
  copyrightName: string
  familyOrgs: string[]
  seo: {
    metaTitleDefault: string
    metaTitleTemplate: string
    metaDescription: string
    keywords: string[]
    twitterHandle: string
    themeColor: string
  }
  schema: {
    orgName: string
    location: string
    alternateNames: string[]
  }
}

const arrVals = (v: unknown, key: string): string[] =>
  ((v as Record<string, string>[] | undefined)?.map((o) => o[key]).filter(Boolean) as string[]) ?? []

export async function getSiteSettings(): Promise<SiteSettings> {
  const payload = await getPayloadClient()
  const s = (await payload.findGlobal({ slug: 'site-settings' })) as unknown as Record<
    string,
    unknown
  >
  const orgs = arrVals(s.familyOrgs, 'name')
  const keywords = arrVals(s.keywords, 'value')
  const alt = arrVals(s.schemaAlternateNames, 'value')
  const str = (k: string, d: string) => (s[k] as string) || d
  return {
    siteName: str('siteName', 'S8ULverse'),
    wordmarkSuffix: str('wordmarkSuffix', 'VERSE'),
    tagline: str('tagline', 'Where legends live.'),
    location: str('location', 'Surat · India'),
    copyrightName: str('copyrightName', 'S8ULverse'),
    familyOrgs: orgs.length ? orgs : ['S8UL', 'SouL', '8Bit', '8Bit Creative'],
    seo: {
      metaTitleDefault: str('metaTitleDefault', 'S8ULverse — Where legends live'),
      metaTitleTemplate: str('metaTitleTemplate', '%s — S8ULverse'),
      metaDescription: str(
        'metaDescription',
        'The cinematic home of the S8UL family — S8UL, Team SouL, 8Bit & 8Bit Creative. Player & creator profiles, rosters, honours and the road to EWC 2026.',
      ),
      keywords: keywords.length
        ? keywords
        : ['S8UL', 'Team SouL', '8Bit', 'Indian esports', 'BGMI', 'Valorant', 'EWC 2026', 'S8ULverse'],
      twitterHandle: str('twitterHandle', '@S8ulEsports'),
      themeColor: str('themeColor', '#08080b'),
    },
    schema: {
      orgName: str('schemaOrgName', 'S8UL'),
      location: str('schemaLocation', 'Mumbai, India'),
      alternateNames: alt.length ? alt : ['Team SouL', '8Bit', '8Bit Creative'],
    },
  }
}

// ─── Page intros (interior page headers + About story) ──────────────────────

export interface Intro {
  kicker: string
  title: string
  subtitle: string
}
export interface PageIntros {
  players: Intro
  orgs: Intro
  ewc: { kicker: string; subtitle: string }
  achievements: Intro
  founders: { kicker: string; title: string }
  about: { kicker: string; title: string; subtitle: string; lead: string; body: string }
}

export async function getPageIntros(): Promise<PageIntros> {
  const payload = await getPayloadClient()
  const p = (await payload.findGlobal({ slug: 'page-intros' })) as unknown as Record<string, unknown>
  const g = (k: string) => (p[k] as Record<string, string> | undefined) ?? {}
  const intro = (k: string, kicker: string, title: string, subtitle: string): Intro => {
    const v = g(k)
    return { kicker: v.kicker || kicker, title: v.title || title, subtitle: v.subtitle || subtitle }
  }
  const ewc = g('ewc')
  const founders = g('founders')
  const about = g('about')
  return {
    players: intro(
      'players',
      'The faces',
      'Roster',
      'Every player, creator, coach and owner across the S8UL family — one tap from their full profile.',
    ),
    orgs: intro(
      'orgs',
      'The dynasties',
      'Organizations',
      'Four banners, one family — the orgs that shaped Indian esports.',
    ),
    ewc: {
      kicker: ewc.kicker || 'The road ahead',
      subtitle:
        ewc.subtitle ||
        'The countdown and the campaign — every S8UL-family fixture on the way to esports’ biggest stage.',
    },
    achievements: intro(
      'achievements',
      'The record',
      'Honours',
      'A decade of firsts — the trophies and milestones that built the dynasty.',
    ),
    founders: {
      kicker: founders.kicker || 'The architects',
      title: founders.title || 'Founders',
    },
    about: {
      kicker: about.kicker || 'The story',
      title: about.title || 'About',
      subtitle: about.subtitle || 'One family, four banners, a generation of Indian esports.',
      lead:
        about.lead ||
        'S8ULverse is the cinematic home of the S8UL family — a single place to follow the players, creators and teams of S8UL, Team SouL, 8Bit and 8Bit Creative.',
      body:
        about.body ||
        'From the early days of mobile esports to world stages, this is the roster, the record and the road ahead — curated, verified and built for the fans who made it a movement.',
    },
  }
}

// ─── Homepage copy ──────────────────────────────────────────────────────────

export interface HomepageContent {
  heroEyebrow: string
  heroHeadline: { word: string; accent: boolean }[]
  heroGhostText: string
  heroSubtitle: string
  heroCtaLabel: string
  heroCtaHref: string
  statMembersLabel: string
  statOrgsLabel: string
  statTitlesLabel: string
  statReachLabel: string
  // Optional display overrides — blank means "auto-calculate from content".
  statMembersValue: string
  statOrgsValue: string
  statTitlesValue: string
  statReachValue: string
  orgsKicker: string
  orgsTitle: string
  rosterKicker: string
  rosterTitle: string
  ctaEyebrow: string
  ctaTitle: string
  ctaPrimaryLabel: string
  ctaPrimaryHref: string
  ctaSecondaryLabel: string
  ctaSecondaryHref: string
}

export async function getHomepage(): Promise<HomepageContent> {
  const payload = await getPayloadClient()
  const h = (await payload.findGlobal({ slug: 'homepage' })) as unknown as Record<string, unknown>
  const str = (k: string, d: string) => (h[k] as string) || d
  const headline = (h.heroHeadline as { word?: string; accent?: boolean }[] | undefined)
    ?.filter((w) => w.word)
    .map((w) => ({ word: w.word as string, accent: Boolean(w.accent) }))
  return {
    heroEyebrow: str('heroEyebrow', 'S8UL · SOUL · 8BIT · 8BIT CREATIVE'),
    heroHeadline: headline?.length
      ? headline
      : [
          { word: 'WHERE', accent: false },
          { word: 'LEGENDS', accent: true },
          { word: 'LIVE', accent: false },
        ],
    heroGhostText: str('heroGhostText', 'S8ULVERSE'),
    heroSubtitle: str(
      'heroSubtitle',
      'The cinematic home of the S8UL family — every player, every creator, one universe.',
    ),
    heroCtaLabel: str('heroCtaLabel', 'Enter roster'),
    heroCtaHref: str('heroCtaHref', '#roster'),
    statMembersLabel: str('statMembersLabel', 'Players & creators'),
    statOrgsLabel: str('statOrgsLabel', 'Organizations'),
    statTitlesLabel: str('statTitlesLabel', 'Titles'),
    statReachLabel: str('statReachLabel', 'Combined reach'),
    statMembersValue: str('statMembersValue', ''),
    statOrgsValue: str('statOrgsValue', ''),
    statTitlesValue: str('statTitlesValue', ''),
    statReachValue: str('statReachValue', ''),
    orgsKicker: str('orgsKicker', 'The dynasties'),
    orgsTitle: str('orgsTitle', 'Organizations'),
    rosterKicker: str('rosterKicker', 'The faces'),
    rosterTitle: str('rosterTitle', 'Featured roster'),
    ctaEyebrow: str('ctaEyebrow', 'One family · four banners'),
    ctaTitle: str('ctaTitle', 'Explore the universe of S8UL'),
    ctaPrimaryLabel: str('ctaPrimaryLabel', 'Browse the roster →'),
    ctaPrimaryHref: str('ctaPrimaryHref', '/players'),
    ctaSecondaryLabel: str('ctaSecondaryLabel', 'The story'),
    ctaSecondaryHref: str('ctaSecondaryHref', '/about'),
  }
}

// ─── Featured Event (EWC band) ──────────────────────────────────────────────

export interface FeaturedEventContent {
  kicker: string
  title: string
  eventName: string
  dateRangeLabel: string
  location: string
  prize: string
  startsAt: string
  teamPrefix: string
  description: string
}

export async function getFeaturedEvent(): Promise<FeaturedEventContent> {
  const payload = await getPayloadClient()
  const e = (await payload.findGlobal({ slug: 'featured-event' })) as unknown as Record<
    string,
    unknown
  >
  const str = (k: string, d: string) => (e[k] as string) || d
  return {
    kicker: str('kicker', 'Road to Paris'),
    title: str('title', 'EWC 2026'),
    eventName: str('eventName', 'Esports World Cup'),
    dateRangeLabel: str('dateRangeLabel', 'JUL 6 — AUG 23'),
    location: str('location', 'Paris, France'),
    prize: str('prize', '$75M'),
    startsAt: str('startsAt', '2026-07-06T00:00:00.000Z'),
    teamPrefix: str('teamPrefix', 'S8UL'),
    description: str(
      'description',
      'S8UL returns as one of 40 official club partners — competing across 8+ titles in Paris.',
    ),
  }
}
