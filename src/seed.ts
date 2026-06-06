import 'dotenv/config'

import path from 'path'

import { getPayload, type CollectionSlug, type Payload } from 'payload'

import config from './payload.config'

// Real current S8UL-family roster (sourced from the s8ul-hq dataset / s8ul.gg,
// May 2026). Orgs + games are upserted by slug; members + teams are RESET each
// run so the roster always matches this file. Never touches users or media.

async function upsert(
  payload: Payload,
  collection: CollectionSlug,
  slug: string,
  data: Record<string, unknown>,
) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length) {
    return payload.update({ collection, id: existing.docs[0].id, data: data as never })
  }
  return payload.create({ collection, data: { ...data, slug } as never })
}

async function reset(payload: Payload, collection: CollectionSlug) {
  await payload.delete({ collection, where: { id: { exists: true } } as never })
}

// Upload an image into Media once (keyed by alt text), returning its id. Lets us
// re-run the seed without piling up duplicate media.
async function uploadOnce(payload: Payload, filePath: string, alt: string) {
  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length) return existing.docs[0].id
  const created = await payload.create({ collection: 'media', filePath, data: { alt } as never })
  return created.id
}

const assetsDir = path.join(process.cwd(), 'seed-assets', 'players')
const publicDir = path.join(process.cwd(), 'public')

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('🌱  Seeding S8ULverse with current roster…')

  // ── Games ───────────────────────────────────────────────
  const bgmi = await upsert(payload, 'games', 'bgmi', { name: 'BGMI' })
  const valorant = await upsert(payload, 'games', 'valorant', { name: 'Valorant' })
  await upsert(payload, 'games', 'cod-mobile', { name: 'COD Mobile' })

  // ── Organizations ───────────────────────────────────────
  const s8ulLogo = await uploadOnce(payload, path.join(publicDir, 's8ul-logo.webp'), 'S8UL logo')

  const s8ul = await upsert(payload, 'organizations', 's8ul', {
    name: 'S8UL',
    shortName: 'S8UL',
    accentHex: '#e63946',
    founded: 2022,
    isVerified: true,
    logo: s8ulLogo,
    description:
      'India’s flagship esports & content organisation — Esports World Cup club partner and three-time Content Group of the Year. HQ in Mumbai.',
    youtube: 'https://youtube.com/@S8ULGG_',
    twitter: 'https://twitter.com/S8ulEsports',
    instagram: 'https://instagram.com/s8ul.esports/',
  })
  const soul = await upsert(payload, 'organizations', 'soul', {
    name: 'Team SouL',
    shortName: 'SouL',
    accentHex: '#ffd700',
    founded: 2017,
    isVerified: true,
    description:
      'One of India’s most decorated BGMI rosters — BGIS 2026 champions, competing as Team iQOOSouL.',
    instagram: 'https://instagram.com/soulesportsofficial/',
  })
  await upsert(payload, 'organizations', '8bit', {
    name: '8Bit',
    shortName: '8Bit',
    accentHex: '#3b82f6',
    founded: 2019,
    isVerified: true,
    description: 'The org and creator collective co-founded by Animesh “8bit Thug” Agarwal.',
  })
  const eightbitCreative = await upsert(payload, 'organizations', '8bit-creative', {
    name: '8Bit Creative',
    shortName: '8Bit Creative',
    accentHex: '#ec4899',
    founded: 2020,
    isVerified: true,
    description: 'The talent and creator management arm of the S8UL family.',
  })

  // ── Reset roster (members reference teams, so delete members first) ──
  await reset(payload, 'members')
  await reset(payload, 'teams')

  // ── Teams ───────────────────────────────────────────────
  const soulBgmi = await payload.create({
    collection: 'teams',
    data: { name: 'Team iQOOSouL', slug: 'team-iqoosoul', org: soul.id, game: bgmi.id, isActive: true } as never,
  })
  const s8ulValorant = await payload.create({
    collection: 'teams',
    data: { name: 'S8UL Valorant', slug: 's8ul-valorant', org: s8ul.id, game: valorant.id, isActive: true } as never,
  })

  // ── Members (current rosters) ───────────────────────────
  type Seed = {
    slug: string
    ign: string
    realName: string
    role: 'PLAYER' | 'CREATOR' | 'OWNER' | 'COACH' | 'ANALYST'
    org: string | number
    team?: string | number
    country?: string
    bio: string
    socials?: Array<{ platform: string; handle?: string; url: string; followers?: number }>
  }

  const members: Seed[] = [
    // — Founders / creators —
    {
      slug: '8bit-thug', ign: '8bit Thug', realName: 'Animesh Agarwal', role: 'OWNER', org: s8ul.id,
      bio: 'Founder & CEO of 8Bit Creatives and S8UL — entrepreneur, ex-pro and Monster Energy athlete.',
      socials: [{ platform: 'YOUTUBE', handle: '8bitThug', url: 'https://youtube.com/@8bitThug', followers: 1100000 }],
    },
    {
      slug: 'mortal', ign: 'MortaL', realName: 'Naman Mathur', role: 'CREATOR', org: s8ul.id,
      bio: 'Co-founder of S8UL and the face of Indian esports — four-time Esports Awards nominee.',
      socials: [{ platform: 'YOUTUBE', handle: 'mortalyt', url: 'https://youtube.com/@mortalyt', followers: 6960000 }],
    },
    {
      slug: 'payal-gaming', ign: 'Payal Gaming', realName: 'Payal Dhare', role: 'CREATOR', org: eightbitCreative.id,
      bio: 'One of India’s biggest women gaming creators, managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'PAYALGAMING', url: 'https://youtube.com/@PAYALGAMING', followers: 4680000 }],
    },
    {
      slug: 'snax', ign: 'Snax', realName: 'Raj Varma', role: 'CREATOR', org: eightbitCreative.id,
      bio: 'Popular BGMI creator and entertainer under 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'SnaxGaming', url: 'https://youtube.com/@SnaxGaming', followers: 2340000 }],
    },
    {
      slug: 'regaltos', ign: 'Regaltos', realName: 'Parv Singh', role: 'CREATOR', org: eightbitCreative.id,
      bio: 'Former BGMI pro turned content creator, managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'soulregaltos9810', url: 'https://youtube.com/@soulregaltos9810', followers: 2470000 }],
    },
    {
      slug: 'krutika-plays', ign: 'Krutika Plays', realName: 'Krutika Ojha', role: 'CREATOR', org: eightbitCreative.id,
      bio: 'Gaming creator and streamer under 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'KrutikaPlays', url: 'https://youtube.com/@KrutikaPlays', followers: 898000 }],
    },
    {
      slug: 'joker-ki-haveli', ign: 'Joker Ki Haveli', realName: 'Gulrez Khan', role: 'CREATOR', org: eightbitCreative.id,
      bio: 'Content creator managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'JokerKiHaveli', url: 'https://youtube.com/@JokerKiHaveli', followers: 1700000 }],
    },

    // — Team iQOOSouL (BGMI) —
    {
      slug: 'nakul', ign: 'NakuL', realName: 'Nakul Sharma', role: 'PLAYER', org: soul.id, team: soulBgmi.id,
      bio: 'In-game leader and scout for Team iQOOSouL (BGMI) — the captain’s shot-caller.',
    },
    {
      slug: 'goblin', ign: 'Goblin', realName: 'Harsh Paudwal', role: 'PLAYER', org: soul.id, team: soulBgmi.id,
      bio: 'Fragger for Team iQOOSouL (BGMI), built for aggressive entries.',
    },
    {
      slug: 'legit', ign: 'LEGIT', realName: 'Yash Choudhary', role: 'PLAYER', org: soul.id, team: soulBgmi.id,
      bio: 'MVP fragger for Team iQOOSouL — a standout at BGIS 2026.',
    },
    {
      slug: 'jokerr', ign: 'Jokerr', realName: 'Khush Singh', role: 'PLAYER', org: soul.id, team: soulBgmi.id,
      bio: 'Assaulter for Team iQOOSouL (BGMI).',
    },
    {
      slug: 'thunder', ign: 'Thunder', realName: 'Aaryaman Seth', role: 'PLAYER', org: soul.id, team: soulBgmi.id,
      bio: 'Support anchor for Team iQOOSouL (BGMI).',
    },

    // — S8UL Valorant —
    {
      slug: 'rvk', ign: 'RvK', realName: 'Rishi Vijayakumar', role: 'PLAYER', org: s8ul.id, team: s8ulValorant.id,
      bio: 'Captain, IGL and initiator for S8UL’s Valorant roster.',
    },
    {
      slug: 'skrossi', ign: 'SkRossi', realName: 'Ganesh Gangadhar', role: 'PLAYER', org: s8ul.id, team: s8ulValorant.id,
      bio: 'Sentinel and one of India’s most celebrated Valorant talents.',
      socials: [{ platform: 'YOUTUBE', handle: 'SkRossi', url: 'https://youtube.com/@SkRossi', followers: 162000 }],
    },
    {
      slug: 'anq', ign: 'Anq', realName: 'Ilya Matyash', role: 'PLAYER', org: s8ul.id, team: s8ulValorant.id, country: 'RU',
      bio: 'Duelist for S8UL Valorant — the team’s primary entry.',
    },
    {
      slug: 'yuvi', ign: 'Yuvi', realName: 'Yuvraj Singh', role: 'PLAYER', org: s8ul.id, team: s8ulValorant.id,
      bio: 'Controller for S8UL Valorant.',
    },
    {
      slug: 'xexxar', ign: 'xexxar', realName: 'Alen Kadyrbayev', role: 'PLAYER', org: s8ul.id, team: s8ulValorant.id, country: 'KZ',
      bio: 'Flex player for S8UL Valorant.',
    },
    {
      slug: 'hacker', ign: 'hacker', realName: 'Vikrant Pujari', role: 'COACH', org: s8ul.id, team: s8ulValorant.id,
      bio: 'Head coach of S8UL’s Valorant roster.',
    },
  ]

  // Hand-picked homepage lineup (a mix of marquee creators + active pros).
  const FEATURED = new Set([
    'mortal', '8bit-thug', 'payal-gaming', 'snax', 'nakul', 'legit', 'rvk', 'skrossi',
  ])

  // In-game roles (from the roster dataset).
  const POSITION: Record<string, string> = {
    nakul: 'IGL', goblin: 'Fragger', legit: 'Fragger', jokerr: 'Assaulter', thunder: 'Support',
    rvk: 'IGL / Initiator', skrossi: 'Sentinel', anq: 'Duelist', yuvi: 'Controller', xexxar: 'Flex',
    hacker: 'Head Coach',
  }

  // Photos available in seed-assets (the BGMI squad).
  const PHOTOS: Record<string, string> = {
    nakul: 'nakul.png', goblin: 'goblin.png', jokerr: 'jokerr.png', legit: 'legit.png', thunder: 'thunder.png',
  }

  // Extra platforms (illustrative follower counts — edit in /admin).
  const EXTRA_SOCIALS: Record<
    string,
    Array<{ platform: string; handle?: string; url: string; followers?: number }>
  > = {
    mortal: [
      { platform: 'INSTAGRAM', handle: 'ig_mortal', url: 'https://instagram.com/ig_mortal', followers: 4000000 },
      { platform: 'TWITTER', handle: 'ig_mortal', url: 'https://twitter.com/ig_mortal', followers: 900000 },
    ],
    '8bit-thug': [
      { platform: 'INSTAGRAM', handle: '8bit_thug', url: 'https://instagram.com/8bit_thug', followers: 1200000 },
    ],
    'payal-gaming': [
      { platform: 'INSTAGRAM', handle: 'payalgamingg', url: 'https://instagram.com/payalgamingg', followers: 2500000 },
    ],
    skrossi: [
      { platform: 'TWITTER', handle: 'SkRossi24', url: 'https://twitter.com/SkRossi24', followers: 400000 },
    ],
    nakul: [
      { platform: 'INSTAGRAM', handle: 'nakul.bgmi', url: 'https://instagram.com/nakul.bgmi', followers: 700000 },
    ],
  }

  // Career journeys (illustrative milestones — curate in /admin).
  const CAREER: Record<string, Array<{ year: string; title: string; description?: string }>> = {
    mortal: [
      { year: '2013', title: 'Started his gaming YouTube channel' },
      { year: '2018', title: 'Founded Team SouL', description: 'Built one of India’s most iconic BGMI rosters.' },
      { year: '2022', title: 'Co-founded S8UL', description: 'Formed from the merger of Team SouL and 8Bit.' },
      { year: '2025', title: 'Lifted S8UL’s 4th Content Group trophy', description: 'On stage at Esports Awards 2025, Las Vegas.' },
    ],
    '8bit-thug': [
      { year: '2018', title: 'Founded 8Bit Creatives' },
      { year: '2022', title: 'Co-founded & became CEO of S8UL' },
      { year: '2025', title: 'Esports Personality of the Year', description: 'Won at Esports Awards 2025 in Las Vegas.' },
    ],
    // — Team SouL (BGMI) —
    nakul: [
      { year: '2023', title: 'Played for Blind eSports' },
      { year: '2024', title: 'Joined Team SouL' },
      { year: '2025', title: 'Shifted to in-game leader', description: 'Took over IGL duties after BMPS 2025.' },
      { year: '2026', title: 'Captained iQOOSouL to the BGIS title' },
    ],
    goblin: [
      { year: '2023', title: 'Came up through NewST, Strong Hold & iNSANE' },
      { year: '2024', title: 'Moved to Carnival Gaming' },
      { year: '2025', title: 'Rejoined Team SouL' },
    ],
    jokerr: [
      { year: '2024', title: 'Played for Team SouL, then Team XSpark' },
      { year: '2025', title: 'Returned to Team SouL' },
    ],
    legit: [
      { year: '2025', title: 'Joined Team SouL' },
      { year: '2026', title: 'MVP-calibre form at BGIS' },
    ],
    thunder: [{ year: '2025', title: 'Joined Team SouL as support' }],
    // — S8UL Valorant —
    rvk: [
      { year: '2023', title: 'Played across Reckoning, True Rippers & Enigma Gaming' },
      { year: '2026', title: 'Became S8UL’s Valorant captain & IGL' },
    ],
    skrossi: [
      { year: '2017', title: 'Rose to fame in CS:GO' },
      { year: '2020', title: 'Switched to Valorant' },
      { year: '2026', title: 'Named IGL of the rebuilt S8UL roster' },
    ],
    anq: [
      { year: '2024', title: 'Played for Reckoning, NOVO & Valiant', description: 'Across Russia, India and France.' },
      { year: '2026', title: 'Joined S8UL Valorant as duelist' },
    ],
    yuvi: [
      { year: '2025', title: 'Developed with the Global Esports academy' },
      { year: '2026', title: 'Promoted to S8UL’s main Valorant roster' },
    ],
    xexxar: [{ year: '2026', title: 'Joined S8UL Valorant as flex' }],
    hacker: [{ year: '2026', title: 'Appointed head coach of S8UL Valorant' }],
    // — Creators —
    'payal-gaming': [
      { year: '2020', title: 'Started her gaming channel' },
      { year: '2022', title: 'Joined 8Bit Creatives' },
      { year: '2024', title: 'Among India’s biggest women creators' },
    ],
    regaltos: [
      { year: '2019', title: 'Competed as a BGMI / PUBG Mobile pro' },
      { year: '2022', title: 'Moved into content creation with 8Bit Creatives' },
    ],
  }

  for (const m of members) {
    const { team, ...rest } = m
    const avatar = PHOTOS[m.slug]
      ? await uploadOnce(payload, path.join(assetsDir, PHOTOS[m.slug]), `${m.ign} avatar`)
      : undefined
    await payload.create({
      collection: 'members',
      data: {
        ...rest,
        socials: [...(m.socials ?? []), ...(EXTRA_SOCIALS[m.slug] ?? [])],
        country: m.country ?? 'IN',
        isVerified: true,
        isActive: true,
        featured: FEATURED.has(m.slug),
        ...(POSITION[m.slug] ? { position: POSITION[m.slug] } : {}),
        ...(CAREER[m.slug] ? { career: CAREER[m.slug] } : {}),
        ...(avatar ? { avatar } : {}),
        ...(team ? { teams: [team] } : {}),
      } as never,
    })
  }

  // ── Achievements (timeline) ─────────────────────────────
  await reset(payload, 'achievements')
  const achievements: Array<{
    slug: string
    year: string
    title: string
    category: string
    sortKey: number
    description: string
  }> = [
    {
      slug: 'ewc-2026-partner', year: '2026', title: 'EWC 2026 Club Partner', category: 'EWC', sortKey: 202603,
      description:
        'Second straight year as one of 40 official Esports World Cup club partners, competing across 8+ titles in Paris.',
    },
    {
      slug: 'bgis-2026-champions', year: '2026', title: 'BGIS 2026 Champions', category: 'BGMI', sortKey: 202602,
      description:
        'Team iQOOSouL lifts the BGIS grand-final trophy in Chennai before a record 577K peak viewers.',
    },
    {
      slug: 'valorant-rebuild-2026', year: '2026', title: 'Valorant Rebuild', category: 'Valorant', sortKey: 202601,
      description: 'A new-look Valorant roster led by SkRossi assembled for the 2026 season.',
    },
    {
      slug: 'ewc-2025-only-indian-org', year: '2025', title: 'EWC 2025 — Only Indian Org', category: 'EWC', sortKey: 202502,
      description:
        'The only Indian organisation at the 2025 Esports World Cup, fielding teams across eight titles.',
    },
    {
      slug: 'codm-expansion-2025', year: '2025', title: 'CODM Expansion', category: 'CODM', sortKey: 202501,
      description: 'Entered Call of Duty: Mobile with a full competitive roster.',
    },
    {
      slug: 'personality-2025', year: '2025', title: 'Esports Personality of the Year', category: 'Awards', sortKey: 202505,
      description:
        'Co-founder Animesh “8bit Thug” Agarwal wins Esports Personality of the Year at Esports Awards 2025 — making S8UL the first Indian org to take two titles in one night.',
    },
    {
      slug: 'content-group-4x', year: '2025', title: '4× Content Group of the Year', category: 'Awards', sortKey: 202504,
      description:
        'First org to win Esports Content Group of the Year four years running (2022–2025), lifted on stage in Las Vegas by founders MortaL, 8bit Thug and Goldy.',
    },
    {
      slug: 'mobies-2023', year: '2023', title: 'MOBIES Global Impact Award', category: 'Awards', sortKey: 202301,
      description:
        'First Indian esports org to win a MOBIES award for global impact in mobile gaming.',
    },
  ]
  for (const a of achievements) {
    await payload.create({ collection: 'achievements', data: a as never })
  }

  // ── Founders ────────────────────────────────────────────
  await reset(payload, 'founders')
  const founders = [
    {
      slug: 'animesh-agarwal', name: 'Animesh Agarwal', alias: '8Bit Thug', order: 1,
      role: 'Founder & CEO, 8Bit Creatives',
      bio: 'Founder and CEO of 8Bit Creatives and S8UL — entrepreneur, ex-pro and a pioneer of the esports business in India. Named Esports Personality of the Year at Esports Awards 2025.',
    },
    {
      slug: 'naman-mathur', name: 'Naman Mathur', alias: 'MortaL', order: 2,
      role: 'Co-founder, S8UL',
      bio: 'The face of Indian esports and a four-time Esports Awards nominee — a driving force behind S8UL’s rise.',
    },
    {
      slug: 'lokesh-jain', name: 'Lokesh Jain', alias: 'Goldy', order: 3,
      role: 'Co-founder, 8Bit Creatives & S8UL',
      bio: 'A co-founder with a business background, instrumental in nurturing talent and growing Indian esports.',
    },
    {
      slug: 'sumit-sovasaria', name: 'Sumit Sovasaria', order: 4,
      role: 'Co-founder, S8UL',
      bio: 'A co-founder and industrialist whose experience scaling businesses guides S8UL’s next phase of growth.',
    },
  ]
  for (const f of founders) {
    await payload.create({ collection: 'founders', data: f as never })
  }

  // ── EWC 2026 fixtures ───────────────────────────────────
  await reset(payload, 'matches')
  const matches = [
    { opponent: 'Team Falcons', competition: 'BGMI — Group Stage', game: 'BGMI', startsAt: '2026-07-08T16:00:00+04:00' },
    { opponent: 'ONIC', competition: 'MLBB — Group A', game: 'MLBB', startsAt: '2026-07-10T18:00:00+04:00' },
    { opponent: 'Cloud9', competition: 'CoD Warzone — R1', game: 'CoD', startsAt: '2026-07-12T20:00:00+04:00' },
    { opponent: 'GodLike', competition: 'BGMI — India Derby', game: 'BGMI', startsAt: '2026-07-15T16:00:00+04:00' },
    { opponent: 'Fnatic', competition: 'Tekken 8 — Group B', game: 'Tekken', startsAt: '2026-07-18T14:00:00+04:00' },
  ]
  for (const m of matches) {
    await payload.create({
      collection: 'matches',
      data: { ...m, event: 'EWC 2026', status: 'UPCOMING' } as never,
    })
  }

  // ── Navigation (header + footer menus) ──────────────────
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: [
        { label: 'Players', href: '/players' },
        { label: 'Orgs', href: '/orgs' },
        { label: 'EWC 2026', href: '/ewc' },
        { label: 'Honours', href: '/achievements' },
        { label: 'About', href: '/about' },
      ],
      footerColumns: [
        {
          heading: 'Explore',
          links: [
            { label: 'Players', href: '/players' },
            { label: 'Organizations', href: '/orgs' },
            { label: 'EWC 2026', href: '/ewc' },
            { label: 'Honours', href: '/achievements' },
          ],
        },
        {
          heading: 'Studio',
          links: [{ label: 'About', href: '/about' }],
        },
      ],
      social: [
        { platform: 'YouTube', url: 'https://youtube.com/@S8ULGG_' },
        { platform: 'Twitter', url: 'https://twitter.com/S8ulEsports' },
        { platform: 'Instagram', url: 'https://instagram.com/s8ul.esports/' },
      ],
      footerTagline: 'Where legends live.',
    } as never,
  })

  payload.logger.info(
    `✅  Seeded ${members.length} members · 4 orgs · 2 teams · ${achievements.length} achievements · ${founders.length} founders · ${matches.length} fixtures.`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
