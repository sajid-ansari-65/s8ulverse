import 'dotenv/config'

import path from 'path'

import { getPayload, type CollectionSlug, type Payload } from 'payload'

import config from './payload.config'

// S8UL-family seed. v1 focus = Team SouL legacy (founders → current, dated
// stints, rejoins, multi-org careers) + honours with winner links + the iQOO
// Title brand, alongside the current S8UL/8Bit rosters already on the site.
//
// NON-DESTRUCTIVE (D-N1): everything is `createIfAbsent` — a record is inserted
// only when its key is missing, NEVER overwritten. So admin enrichment (avatars,
// socials, hand-added tenures) survives every reseed, and with no deletes the
// E5 cascade hooks never fire during seeding. Re-run it as often as you like.
// (`matches` is the one exception — fixtures are disposable, so they reset.)

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

// Insert only when no row matches `where`; otherwise return the existing row.
// The baseline filler that never clobbers admin edits.
async function createIfAbsent(
  payload: Payload,
  collection: CollectionSlug,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<{ id: number | string }> {
  const { docs } = await payload.find({ collection, where: where as never, limit: 1, depth: 0 })
  if (docs[0]) return docs[0] as { id: number | string }
  return (await payload.create({ collection, data: data as never })) as { id: number | string }
}

async function reset(payload: Payload, collection: CollectionSlug) {
  await payload.delete({ collection, where: { id: { exists: true } } as never })
}

// Upload an image into Media once (keyed by alt text), returning its id.
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

// ─── Types for the data tables ──────────────────────────────────────────────
type Role = 'PLAYER' | 'CREATOR' | 'OWNER' | 'COACH' | 'ANALYST' | 'MANAGER'

interface MemberSeed {
  slug: string
  ign: string
  realName?: string
  role: Role
  orgSlug: string // current / primary org
  teamSlug?: string // current squad (display)
  country?: string
  isActive?: boolean // default true
  bio?: string
  socials?: Array<{ platform: string; handle?: string; url: string; followers?: number }>
}

interface Stint {
  orgSlug?: string // a family org … OR
  externalOrg?: string // a non-family club (one of these two is required)
  externalUrl?: string
  teamSlug?: string
  role: Role
  joinedAt: string // YYYY-MM-DD
  leftAt?: string
  isFounding?: boolean
  note?: string // e.g. "approximate dates — verify"
}

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('🌱  Seeding S8ULverse (SouL legacy + current rosters, non-destructive)…')

  // ── Games ───────────────────────────────────────────────
  const bgmi = await upsert(payload, 'games', 'bgmi', { name: 'BGMI' })
  const valorant = await upsert(payload, 'games', 'valorant', { name: 'Valorant' })
  const codm = await upsert(payload, 'games', 'cod-mobile', { name: 'COD Mobile' })
  const gameBySlug: Record<string, number | string> = {
    bgmi: bgmi.id,
    valorant: valorant.id,
    'cod-mobile': codm.id,
  }

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
      'India’s flagship esports & content organisation — Esports World Cup club partner and four-time Content Group of the Year. HQ in Mumbai.',
    youtube: 'https://youtube.com/@S8ULGG_',
    twitter: 'https://twitter.com/S8ulEsports',
    instagram: 'https://instagram.com/s8ul.esports/',
  })
  const soul = await upsert(payload, 'organizations', 'soul', {
    name: 'Team SouL',
    shortName: 'SouL',
    accentHex: '#ffd700',
    founded: 2018,
    isVerified: true,
    description:
      'One of India’s most decorated BGMI rosters — BGIS 2026 champions, competing as Team iQOOSouL. Founded in 2018 by MortaL.',
    instagram: 'https://instagram.com/soulesportsofficial/',
  })
  const eightbit = await upsert(payload, 'organizations', '8bit', {
    name: '8Bit',
    shortName: '8Bit',
    accentHex: '#3b82f6',
    founded: 2018,
    isVerified: true,
    description:
      'Founded in 2018 by Animesh “8bit Thug” Agarwal, 8Bit is a competitive BGMI org and creator collective in the S8UL family. Its BGMI roster — now led by owner Beg4Mercy and competing as Team iQOO 8Bit — has lifted Ranbhoomi, Gauntlet and Slayy Zone titles.',
  })
  const eightbitCreative = await upsert(payload, 'organizations', '8bit-creative', {
    name: '8Bit Creative',
    shortName: '8Bit Creative',
    accentHex: '#ec4899',
    founded: 2020,
    isVerified: true,
    description: 'The talent and creator management arm of the S8UL family.',
  })
  const orgBySlug: Record<string, number | string> = {
    s8ul: s8ul.id,
    soul: soul.id,
    '8bit': eightbit.id,
    '8bit-creative': eightbitCreative.id,
  }

  // ── Teams (createIfAbsent by slug) ──────────────────────
  const TEAMS = [
    { slug: 'team-iqoosoul', name: 'Team iQOOSouL', orgSlug: 'soul', gameSlug: 'bgmi' },
    { slug: 's8ul-valorant', name: 'S8UL Valorant', orgSlug: 's8ul', gameSlug: 'valorant' },
    { slug: 'team-iqoo-8bit', name: 'Team iQOO 8Bit', orgSlug: '8bit', gameSlug: 'bgmi' },
  ]
  const teamBySlug: Record<string, number | string> = {}
  for (const t of TEAMS) {
    const team = await createIfAbsent(
      payload,
      'teams',
      { slug: { equals: t.slug } },
      { name: t.name, slug: t.slug, org: orgBySlug[t.orgSlug], game: gameBySlug[t.gameSlug], isActive: true },
    )
    teamBySlug[t.slug] = team.id
  }

  // ── Members ─────────────────────────────────────────────
  // Current roster + creators (rich profiles) …
  const members: MemberSeed[] = [
    // — Founders / creators —
    { slug: '8bit-thug', ign: '8bit Thug', realName: 'Animesh Agarwal', role: 'OWNER', orgSlug: 's8ul',
      bio: 'Founder & CEO of 8Bit Creatives and S8UL — entrepreneur, ex-pro and Monster Energy athlete.',
      socials: [{ platform: 'YOUTUBE', handle: '8bitThug', url: 'https://youtube.com/@8bitThug', followers: 1100000 }] },
    { slug: 'mortal', ign: 'MortaL', realName: 'Naman Sandeep Mathur', role: 'CREATOR', orgSlug: 's8ul',
      bio: 'Founder of Team SouL and co-founder of S8UL — the face of Indian esports and a four-time Esports Awards nominee.',
      socials: [{ platform: 'YOUTUBE', handle: 'mortalyt', url: 'https://youtube.com/@mortalyt', followers: 6960000 }] },
    { slug: 'payal-gaming', ign: 'Payal Gaming', realName: 'Payal Dhare', role: 'CREATOR', orgSlug: '8bit-creative',
      bio: 'One of India’s biggest women gaming creators, managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'PAYALGAMING', url: 'https://youtube.com/@PAYALGAMING', followers: 4680000 }] },
    { slug: 'snax', ign: 'Snax', realName: 'Raj Varma', role: 'CREATOR', orgSlug: '8bit-creative',
      bio: 'Popular BGMI creator and entertainer under 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'SnaxGaming', url: 'https://youtube.com/@SnaxGaming', followers: 2340000 }] },
    { slug: 'regaltos', ign: 'Regaltos', realName: 'Parv Singh', role: 'CREATOR', orgSlug: '8bit-creative',
      bio: 'Former Team SouL BGMI pro turned content creator, now managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'soulregaltos9810', url: 'https://youtube.com/@soulregaltos9810', followers: 2470000 }] },
    { slug: 'krutika-plays', ign: 'Krutika Plays', realName: 'Krutika Ojha', role: 'CREATOR', orgSlug: '8bit-creative',
      bio: 'Gaming creator and streamer under 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'KrutikaPlays', url: 'https://youtube.com/@KrutikaPlays', followers: 898000 }] },
    { slug: 'joker-ki-haveli', ign: 'Joker Ki Haveli', realName: 'Gulrez Khan', role: 'CREATOR', orgSlug: '8bit-creative',
      bio: 'Content creator managed by 8Bit Creatives.',
      socials: [{ platform: 'YOUTUBE', handle: 'JokerKiHaveli', url: 'https://youtube.com/@JokerKiHaveli', followers: 1700000 }] },

    // — Team iQOOSouL (BGMI), current —
    { slug: 'nakul', ign: 'NakuL', realName: 'Nakul Sharma', role: 'PLAYER', orgSlug: 'soul', teamSlug: 'team-iqoosoul',
      bio: 'In-game leader and scout for Team iQOOSouL (BGMI) — the captain’s shot-caller.' },
    { slug: 'goblin', ign: 'Goblin', realName: 'Harsh Paudwal', role: 'PLAYER', orgSlug: 'soul', teamSlug: 'team-iqoosoul',
      bio: 'Fragger for Team iQOOSouL (BGMI), built for aggressive entries.' },
    { slug: 'legit', ign: 'LEGIT', realName: 'Yash Choudhary', role: 'PLAYER', orgSlug: 'soul', teamSlug: 'team-iqoosoul',
      bio: 'MVP fragger for Team iQOOSouL — a standout at BGIS 2026.' },
    { slug: 'jokerr', ign: 'Jokerr', realName: 'Khush Singh', role: 'PLAYER', orgSlug: 'soul', teamSlug: 'team-iqoosoul',
      bio: 'Assaulter for Team iQOOSouL (BGMI).' },
    { slug: 'thunder', ign: 'Thunder', realName: 'Aaryaman Seth', role: 'PLAYER', orgSlug: 'soul', teamSlug: 'team-iqoosoul',
      bio: 'Support anchor for Team iQOOSouL (BGMI).' },

    // — S8UL Valorant, current —
    { slug: 'rvk', ign: 'RvK', realName: 'Rishi Vijayakumar', role: 'PLAYER', orgSlug: 's8ul', teamSlug: 's8ul-valorant',
      bio: 'Captain, IGL and initiator for S8UL’s Valorant roster.' },
    { slug: 'skrossi', ign: 'SkRossi', realName: 'Ganesh Gangadhar', role: 'PLAYER', orgSlug: 's8ul', teamSlug: 's8ul-valorant',
      bio: 'Sentinel and one of India’s most celebrated Valorant talents.',
      socials: [{ platform: 'YOUTUBE', handle: 'SkRossi', url: 'https://youtube.com/@SkRossi', followers: 162000 }] },
    { slug: 'anq', ign: 'Anq', realName: 'Ilya Matyash', role: 'PLAYER', orgSlug: 's8ul', teamSlug: 's8ul-valorant', country: 'RU',
      bio: 'Duelist for S8UL Valorant — the team’s primary entry.' },
    { slug: 'yuvi', ign: 'Yuvi', realName: 'Yuvraj Singh', role: 'PLAYER', orgSlug: 's8ul', teamSlug: 's8ul-valorant',
      bio: 'Controller for S8UL Valorant.' },
    { slug: 'xexxar', ign: 'xexxar', realName: 'Alen Kadyrbayev', role: 'PLAYER', orgSlug: 's8ul', teamSlug: 's8ul-valorant', country: 'KZ',
      bio: 'Flex player for S8UL Valorant.' },
    { slug: 'hacker', ign: 'hacker', realName: 'Vikrant Pujari', role: 'COACH', orgSlug: 's8ul', teamSlug: 's8ul-valorant',
      bio: 'Head coach of S8UL’s Valorant roster.' },
  ]

  // … Team SouL legacy (founders + alumni + staff). Minimal profiles — tenures
  // make them appear on the SouL legacy roster now; avatars/socials get enriched
  // in /admin over time (M's phased approach). isActive:false = "Former member".
  const alumni: MemberSeed[] = [
    { slug: 'viper', ign: 'VipeR', realName: 'Yash Paresh Soni', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'A founding member of Team SouL (2018).' },
    { slug: 'ronak', ign: 'RonaK', realName: 'Harpreet Singh Janjuha', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'A founding member of Team SouL (2018).' },
    { slug: 'owais', ign: 'Owais', realName: 'Mohammed Owais Lakhani', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'A founding member of Team SouL (2018); returned to competition with 8Bit in 2024–25.' },
    { slug: 'scout', ign: 'Sc0utOP', realName: 'Tanmay Singh', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'A Team SouL alumnus across the 2019 and 2021 line-ups.' },
    { slug: 'omega', ign: 'Omega', realName: 'Sahil Jakhar', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'An early 8Bit player (2020) who went on to the BMPS 2022-winning Team SouL squad.' },
    { slug: 'akshat', ign: 'AkshaT', realName: 'Akshat Goel', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'An early 8Bit player (2020) who went on to the BMPS 2022-winning Team SouL squad.' },
    { slug: 'hector', ign: 'Hector', realName: 'Sohail Shaikh', role: 'PLAYER', orgSlug: 'soul', isActive: false,
      bio: 'Part of the BMPS 2022-winning Team SouL squad.' },
    { slug: 'ayogi', ign: 'Ayogi', role: 'COACH', orgSlug: 'soul', isActive: true,
      bio: 'Analyst-turned-coach for Team iQOOSouL.' },

    // SouL long-tail alumni (some eras approximate — enrich/verify in admin per M's
    // phased approach; tenures with fuzzy dates carry a `note` flag).
    { slug: 'manya', ign: 'Manya', realName: 'Mohammad Raja', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL BGMI player (2024–25).' },
    { slug: 'rony', ign: 'Rony', realName: 'Manpreet Singh', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL BGMI player (2024–25).' },
    { slug: 'spower', ign: 'Spower', realName: 'Rudra Banswani', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'An 8Bit (2020) and Team SouL (2024) BGMI player.' },
    { slug: 'clutchgod', ign: 'ClutchGod', realName: 'Vivek Aabhas Horo', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A 2019 Team SouL and 8Bit player; later joined Entity Gaming.' },
    { slug: 'sangwan', ign: 'Sangwan', realName: 'Dhruv Sangwan', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL BGMI alumnus (2020).' },
    { slug: 'blaezi', ign: 'Blaezi', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL BGMI alumnus (2020).' },
    { slug: 'mavi', ign: 'Mavi', realName: 'Harmandeep Singh', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL BGMI alumnus (2021).' },
    { slug: 'roxx', ign: 'RoXX', realName: 'Yogesh Yadav', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'An early Team SouL alumnus (2021–22).' },
    { slug: 'viru', ign: 'VIRU', realName: 'Viren Mahipalsingh Gour', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'Played briefly for 8Bit and Team SouL in 2021; later joined Chemin Esports.' },
    { slug: 'yuvaop', ign: 'YuvaOP', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL alumnus.' },
    { slug: 'deathnote', ign: 'Deathnote', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'An early Team SouL alumnus.' },
    { slug: 'ninjajod', ign: 'NinjaJOD', role: 'PLAYER', orgSlug: 'soul', isActive: false, bio: 'A Team SouL alumnus.' },
    { slug: 'sid', ign: 'Sid', role: 'MANAGER', orgSlug: 'soul', isActive: true, bio: 'Team manager for Team iQOOSouL.' },
    { slug: 'mayavi', ign: 'Mayavi', role: 'COACH', orgSlug: 'soul', isActive: false, bio: 'A former Team SouL coach.' },
    { slug: 'amit', ign: 'Amit', role: 'COACH', orgSlug: 'soul', isActive: false, bio: 'Coach of the BMPS 2022-winning Team SouL squad.' },
  ]

  // … 8Bit legacy roster (sourced from Liquipedia). Founder 8bit Thug already
  // exists above (multi-org → gets an 8Bit founding tenure below). Several IGNs
  // collide with SouL alumni but are DIFFERENT people, so those carry `8bit-`
  // prefixed slugs to avoid createIfAbsent merging them onto the SouL records.
  const eightbitRoster: MemberSeed[] = [
    // — Current owner —
    { slug: 'beg4mercy', ign: 'Beg4Mercy', realName: 'Mrinmoy Lahkar', role: 'OWNER', orgSlug: '8bit', isActive: true,
      bio: 'Owner of 8Bit’s BGMI division (Team iQOO 8Bit) since 2022 — a former 8Bit player who now runs the roster.' },

    // — Current Team iQOO 8Bit roster (BGMI) —
    { slug: 'sarang', ign: 'Sarang', realName: 'Sarangajyoti Deka', role: 'PLAYER', orgSlug: '8bit', teamSlug: 'team-iqoo-8bit',
      bio: 'Player for Team iQOO 8Bit (BGMI).' },
    { slug: 'juicy', ign: 'Juicy', realName: 'Vishwas Battoo', role: 'PLAYER', orgSlug: '8bit', teamSlug: 'team-iqoo-8bit',
      bio: 'Player for Team iQOO 8Bit (BGMI).' },
    { slug: 'skipz', ign: 'Skipz', realName: 'Amaan Shaikh', role: 'PLAYER', orgSlug: '8bit', teamSlug: 'team-iqoo-8bit',
      bio: 'Player for Team iQOO 8Bit (BGMI).' },
    { slug: 'shorty', ign: 'Shorty', role: 'PLAYER', orgSlug: '8bit', teamSlug: 'team-iqoo-8bit',
      bio: 'Player for Team iQOO 8Bit (BGMI).' },
    { slug: 'shubh', ign: 'Shubh', role: 'PLAYER', orgSlug: '8bit', teamSlug: 'team-iqoo-8bit',
      bio: 'Player for Team iQOO 8Bit (BGMI).' },

    // — 8Bit alumni (BGMI) —
    { slug: 'madman', ign: 'MadMan', realName: 'Dhruv Gaur', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'A long-serving 8Bit BGMI player (2022–24).' },
    { slug: 'mighty', ign: 'Mighty', realName: 'Shubh', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2023–24); later joined Cincinnati Kids.' },
    { slug: '8bit-beast', ign: 'Beast', realName: 'Harshit Yadav', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2022–23); later joined Global Esports.' },
    { slug: 'ultron', ign: 'Ultron', realName: 'Hemanth Sethi', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2022–23); later joined Hyderabad Hydras.' },
    { slug: 'raiden', ign: 'Raiden', realName: 'Divyansh', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2025–26), part of the Team Versatile acquisition; later joined Team Aryan.' },
    { slug: 'termi', ign: 'Termi', realName: 'Aakash Hirawat', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2024–25); later joined Medal Esports.' },
    { slug: 'insidious', ign: 'Insidious', realName: 'Tanish Tanmoy Patra', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2025); later joined First Curiosity.' },
    { slug: 'sheek', ign: 'Sheek', realName: 'Tarushika', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An 8Bit BGMI player (2025), part of the Team Versatile acquisition.' },
    { slug: '8bit-ash', ign: 'Ash', realName: 'Ashish Bhatnagar', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'An early 8Bit player (2019).' },
    { slug: 'tsunami', ign: 'Tsunami', realName: 'Kartik Holey', role: 'PLAYER', orgSlug: '8bit', isActive: false,
      bio: 'A brief 8Bit player (2022).' },
    // NOTE: Omega, AkshaT, Spower, VIRU, ClutchGod and Owais also played 8Bit, but
    // they are the SAME people as the SouL alumni above (verified by real name on
    // Liquipedia) — so they live as single members with BOTH tenures (see TENURES),
    // NOT as separate `8bit-…` records. Do not re-add them here.

    // — 8Bit staff —
    { slug: 'surya', ign: 'Surya', realName: 'Suryansh Kumar Mishra', role: 'COACH', orgSlug: '8bit', isActive: false,
      bio: 'Head coach of 8Bit’s BGMI roster (2022–23).' },
    { slug: 'iflicks', ign: 'iFlicks', role: 'COACH', orgSlug: '8bit', isActive: false,
      bio: 'An early 8Bit coach (2020).' },
  ]

  const allMembers = [...members, ...alumni, ...eightbitRoster]

  // Hand-picked homepage lineup.
  const FEATURED = new Set(['mortal', '8bit-thug', 'payal-gaming', 'snax', 'nakul', 'legit', 'rvk', 'skrossi'])

  const POSITION: Record<string, string> = {
    nakul: 'IGL', goblin: 'Fragger', legit: 'Fragger', jokerr: 'Assaulter', thunder: 'Support',
    rvk: 'IGL / Initiator', skrossi: 'Sentinel', anq: 'Duelist', yuvi: 'Controller', xexxar: 'Flex',
    hacker: 'Head Coach', ayogi: 'Coach',
  }

  const PHOTOS: Record<string, string> = {
    nakul: 'nakul.png', goblin: 'goblin.png', jokerr: 'jokerr.png', legit: 'legit.png', thunder: 'thunder.png',
  }

  const EXTRA_SOCIALS: Record<string, Array<{ platform: string; handle?: string; url: string; followers?: number }>> = {
    mortal: [
      { platform: 'INSTAGRAM', handle: 'ig_mortal', url: 'https://instagram.com/ig_mortal', followers: 4000000 },
      { platform: 'TWITTER', handle: 'ig_mortal', url: 'https://twitter.com/ig_mortal', followers: 900000 },
    ],
    '8bit-thug': [{ platform: 'INSTAGRAM', handle: '8bit_thug', url: 'https://instagram.com/8bit_thug', followers: 1200000 }],
    'payal-gaming': [{ platform: 'INSTAGRAM', handle: 'payalgamingg', url: 'https://instagram.com/payalgamingg', followers: 2500000 }],
    skrossi: [{ platform: 'TWITTER', handle: 'SkRossi24', url: 'https://twitter.com/SkRossi24', followers: 400000 }],
    nakul: [{ platform: 'INSTAGRAM', handle: 'nakul.bgmi', url: 'https://instagram.com/nakul.bgmi', followers: 700000 }],
  }

  // ── Member create (createIfAbsent by slug) ──────────────
  const memberBySlug: Record<string, number | string> = {}
  for (const m of allMembers) {
    const avatar = PHOTOS[m.slug]
      ? await uploadOnce(payload, path.join(assetsDir, PHOTOS[m.slug]), `${m.ign} avatar`)
      : undefined
    const created = await createIfAbsent(
      payload,
      'members',
      { slug: { equals: m.slug } },
      {
        slug: m.slug,
        ign: m.ign,
        ...(m.realName ? { realName: m.realName } : {}),
        role: m.role,
        org: orgBySlug[m.orgSlug],
        country: m.country ?? 'IN',
        isVerified: true,
        isActive: m.isActive ?? true,
        featured: FEATURED.has(m.slug),
        ...(m.bio ? { bio: m.bio } : {}),
        ...(POSITION[m.slug] ? { position: POSITION[m.slug] } : {}),
        ...(avatar ? { avatar } : {}),
        ...(m.teamSlug ? { teams: [teamBySlug[m.teamSlug]] } : {}),
        socials: [...(m.socials ?? []), ...(EXTRA_SOCIALS[m.slug] ?? [])],
      },
    )
    memberBySlug[m.slug] = created.id
  }

  // ── Tenures (createIfAbsent by member+org+joinedAt) ─────
  // Dated stints — founders, rejoins (Goblin/Jokerr = 2 rows), multi-org careers
  // (MortaL: SouL founder → S8UL owner; ReGaLToS: SouL player → 8Bit Creative).
  const APPROX = 'Approximate dates — verify on Liquipedia.'
  const TENURES: Record<string, Stint[]> = {
    '8bit-thug': [
      { orgSlug: '8bit', role: 'OWNER', joinedAt: '2018-01-01', leftAt: '2021-07-01', isFounding: true, note: APPROX },
      { orgSlug: 's8ul', role: 'OWNER', joinedAt: '2022-01-01', isFounding: true },
    ],
    mortal: [
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2018-12-21', leftAt: '2023-01-16', isFounding: true },
      { orgSlug: 's8ul', role: 'OWNER', joinedAt: '2022-01-01' },
    ],
    'payal-gaming': [{ orgSlug: '8bit-creative', role: 'CREATOR', joinedAt: '2022-01-01' }],
    snax: [{ orgSlug: '8bit-creative', role: 'CREATOR', joinedAt: '2021-01-01' }],
    'krutika-plays': [{ orgSlug: '8bit-creative', role: 'CREATOR', joinedAt: '2022-01-01' }],
    'joker-ki-haveli': [{ orgSlug: '8bit-creative', role: 'CREATOR', joinedAt: '2022-01-01' }],
    regaltos: [
      { externalOrg: 'Team 4HM', role: 'PLAYER', joinedAt: '2019-06-01', leftAt: '2019-12-01', note: APPROX },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2019-09-01', leftAt: '2022-04-18' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2022-04-18', leftAt: '2023-11-15' },
      { orgSlug: '8bit-creative', role: 'CREATOR', joinedAt: '2023-11-15' },
    ],
    // Full timelines incl. non-family clubs (externalOrg), sourced from each
    // player's Liquipedia page. Family SouL stints keep their team; external
    // stints are plain text.
    nakul: [
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-03-29', leftAt: '2023-12-24' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2024-01-01' },
    ],
    goblin: [
      { externalOrg: 'Team NewST', role: 'PLAYER', joinedAt: '2019-03-01', leftAt: '2019-08-01', note: APPROX },
      { externalOrg: 'THUG INDIA', role: 'PLAYER', joinedAt: '2020-02-01', leftAt: '2020-08-01', note: APPROX },
      { externalOrg: 'STRONG HOLD', role: 'PLAYER', joinedAt: '2020-08-01', leftAt: '2021-02-01' },
      { externalOrg: 'TEAM iNSANE', role: 'PLAYER', joinedAt: '2021-05-18', leftAt: '2022-01-25' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2022-03-04', leftAt: '2024-01-11' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-01-11', leftAt: '2024-11-08' },
      { externalOrg: 'Likitha Esports', role: 'PLAYER', joinedAt: '2025-02-03', leftAt: '2025-04-29' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2025-05-01' },
    ],
    legit: [
      { externalOrg: 'MegaStars', role: 'PLAYER', joinedAt: '2023-11-23', leftAt: '2024-05-31' },
      { externalOrg: 'TWOB', role: 'PLAYER', joinedAt: '2024-07-01', leftAt: '2024-10-08' },
      { externalOrg: 'Medal Esports', role: 'PLAYER', joinedAt: '2024-10-16', leftAt: '2025-05-03' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2025-05-13' },
    ],
    jokerr: [
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2022-03-31', leftAt: '2023-03-29' },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-04-02', leftAt: '2023-12-24' },
      { externalOrg: 'Blind eSports', role: 'PLAYER', joinedAt: '2024-01-01', leftAt: '2024-08-19' },
      { externalOrg: 'Revenant XSpark', role: 'PLAYER', joinedAt: '2024-08-19', leftAt: '2025-04-11' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2025-07-20' },
    ],
    thunder: [
      { externalOrg: 'MegaStars', role: 'PLAYER', joinedAt: '2023-11-23', leftAt: '2024-05-31' },
      { externalOrg: 'Medal Esports', role: 'PLAYER', joinedAt: '2025-02-07', leftAt: '2025-05-03' },
      { externalOrg: 'Team Forever', role: 'PLAYER', joinedAt: '2025-05-19', leftAt: '2025-08-15' },
      { externalOrg: 'Victores Sumus', role: 'PLAYER', joinedAt: '2025-08-15', leftAt: '2025-09-17' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2025-09-20' },
    ],
    // S8UL Valorant — full pre-S8UL careers from Liquipedia's Valorant wiki; all
    // joined S8UL 2026-03-02 (not 2026-01-01).
    skrossi: [
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2020-10-04', leftAt: '2023-11-01' },
      { externalOrg: 'Revenant Esports', role: 'PLAYER', joinedAt: '2024-01-30', leftAt: '2024-12-12' },
      { externalOrg: 'Velocity Gaming', role: 'PLAYER', joinedAt: '2025-01-30', leftAt: '2025-12-04' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'PLAYER', joinedAt: '2026-03-02' },
    ],
    rvk: [
      { externalOrg: 'F1 x LS Esports', role: 'PLAYER', joinedAt: '2021-03-25', leftAt: '2021-09-16' },
      { externalOrg: 'Enigma Gaming', role: 'PLAYER', joinedAt: '2021-09-19', leftAt: '2022-12-17' },
      { externalOrg: 'Reckoning Esports', role: 'PLAYER', joinedAt: '2024-01-29', leftAt: '2024-06-18' },
      { externalOrg: 'True Rippers', role: 'PLAYER', joinedAt: '2024-09-26', leftAt: '2024-12-13' },
      { externalOrg: 'DOT EXE', role: 'PLAYER', joinedAt: '2025-04-24', leftAt: '2025-07-25' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'PLAYER', joinedAt: '2026-03-02' },
    ],
    anq: [
      { externalOrg: 'Moscow Five jr', role: 'PLAYER', joinedAt: '2021-03-31', leftAt: '2022-01-16' },
      { externalOrg: 'Veselie Vintovki', role: 'PLAYER', joinedAt: '2022-01-16', leftAt: '2022-03-26' },
      { externalOrg: 'Outplayed', role: 'PLAYER', joinedAt: '2023-03-28', leftAt: '2023-06-16' },
      { externalOrg: 'Reckoning Esports', role: 'PLAYER', joinedAt: '2023-09-16', leftAt: '2024-06-01' },
      { externalOrg: 'VX300 Gaming', role: 'PLAYER', joinedAt: '2024-06-01', leftAt: '2024-07-23' },
      { externalOrg: 'Valiant', role: 'PLAYER', joinedAt: '2025-01-08', leftAt: '2025-08-22' },
      { externalOrg: 'NOVO Esports', role: 'PLAYER', joinedAt: '2025-12-26', leftAt: '2026-02-16' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'PLAYER', joinedAt: '2026-03-02' },
    ],
    yuvi: [
      { externalOrg: 'GE Academy', role: 'PLAYER', joinedAt: '2025-02-04', leftAt: '2025-07-16' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'PLAYER', joinedAt: '2026-03-02' },
    ],
    xexxar: [
      { externalOrg: 'Elite Klan', role: 'PLAYER', joinedAt: '2025-04-14', leftAt: '2025-04-26' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'PLAYER', joinedAt: '2026-03-02' },
    ],
    hacker: [
      { externalOrg: 'ROG Academy', role: 'COACH', joinedAt: '2022-04-03', leftAt: '2023-01-25' },
      { externalOrg: 'Medal Esports', role: 'COACH', joinedAt: '2023-03-05', leftAt: '2023-11-27' },
      { externalOrg: 'Orangutan', role: 'COACH', joinedAt: '2024-01-25', leftAt: '2025-03-31' },
      { orgSlug: 's8ul', teamSlug: 's8ul-valorant', role: 'COACH', joinedAt: '2026-03-02' },
    ],
    // founders & alumni
    viper: [
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2018-12-21', leftAt: '2023-01-16', isFounding: true },
      { orgSlug: 's8ul', role: 'CREATOR', joinedAt: '2020-10-15' },
    ],
    ronak: [
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2018-12-21', leftAt: '2019-09-10', isFounding: true },
      { externalOrg: 'Xspark', role: 'PLAYER', joinedAt: '2019-09-10', leftAt: '2019-10-18' },
      { externalOrg: 'Fnatic', role: 'PLAYER', joinedAt: '2019-10-18', leftAt: '2020-08-09' },
      { externalOrg: 'Oxygen Esports', role: 'PLAYER', joinedAt: '2020-11-20', leftAt: '2021-07-11' },
      { externalOrg: 'Skylightz Gaming', role: 'PLAYER', joinedAt: '2021-07-11', leftAt: '2022-07-01' },
      { externalOrg: 'TWOB', role: 'PLAYER', joinedAt: '2022-07-01', leftAt: '2023-02-01', note: APPROX },
      { externalOrg: 'Entity', role: 'CREATOR', joinedAt: '2023-07-09', leftAt: '2024-03-12' },
      { externalOrg: 'Orangutan', role: 'CREATOR', joinedAt: '2025-06-09', leftAt: '2025-12-19' },
      { externalOrg: 'Nebula Esports', role: 'CREATOR', joinedAt: '2025-12-24', leftAt: '2026-04-20' },
    ],
    owais: [
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2018-12-21', leftAt: '2019-09-10', isFounding: true },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2024-12-03', leftAt: '2025-05-17' },
    ],
    scout: [
      { externalOrg: 'R4W', role: 'PLAYER', joinedAt: '2018-01-01', leftAt: '2018-06-01', note: APPROX },
      { externalOrg: 'TeamIND', role: 'PLAYER', joinedAt: '2018-06-01', leftAt: '2019-01-01', note: APPROX },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2019-01-01', leftAt: '2019-03-04', note: APPROX },
      { externalOrg: 'TeamIND', role: 'PLAYER', joinedAt: '2019-03-04', leftAt: '2019-08-05' },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2019-08-05', leftAt: '2019-09-10' },
      { externalOrg: 'Xspark', role: 'PLAYER', joinedAt: '2019-09-10', leftAt: '2019-10-18' },
      { externalOrg: 'Fnatic', role: 'PLAYER', joinedAt: '2019-10-18', leftAt: '2021-07-07' },
      { orgSlug: 's8ul', role: 'CREATOR', joinedAt: '2020-10-15', leftAt: '2024-10-05' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2021-07-07', leftAt: '2024-01-08' },
      { externalOrg: 'TeamXSpark', role: 'PLAYER', joinedAt: '2024-01-08', leftAt: '2024-12-07' },
      { externalOrg: 'Wyld Fangs', role: 'PLAYER', joinedAt: '2025-07-20', leftAt: '2025-09-18' },
      { externalOrg: 'Medal Esports', role: 'PLAYER', joinedAt: '2025-09-14', leftAt: '2026-04-06' },
      { externalOrg: 'Quantum Sparks', role: 'PLAYER', joinedAt: '2026-05-03' },
    ],
    // Omega: maker confirms (saw live) he was on SouL for BMPS 2022 — Liquipedia's
    // Chemin 2022–23 entry is the confusing/wrong one. SouL 2022-01-13→2024-01-11.
    omega: [
      { externalOrg: 'Maximus', role: 'PLAYER', joinedAt: '2020-06-27', leftAt: '2020-08-30' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2020-08-30', leftAt: '2020-11-17' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2022-01-13', leftAt: '2024-01-11' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-01-11', leftAt: '2024-08-13' },
      { externalOrg: 'WSB Gaming', role: 'PLAYER', joinedAt: '2024-08-13', leftAt: '2024-11-15' },
      { externalOrg: 'K9 Esports', role: 'PLAYER', joinedAt: '2024-11-15', leftAt: '2026-04-18' },
      { externalOrg: 'Divine Gaming', role: 'PLAYER', joinedAt: '2026-05-06' },
    ],
    akshat: [
      { externalOrg: 'REVENGE ESPORTS', role: 'PLAYER', joinedAt: '2019-07-01', leftAt: '2020-06-27', note: APPROX },
      { externalOrg: 'Umumba eSports', role: 'PLAYER', joinedAt: '2020-06-27', leftAt: '2020-08-30' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2020-08-30', leftAt: '2021-10-03' },
      { externalOrg: 'Chemin Esports', role: 'PLAYER', joinedAt: '2021-10-03', leftAt: '2022-01-13' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2022-01-13', leftAt: '2023-12-23' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-01-11', leftAt: '2024-09-19' },
    ],
    // Hector: maker confirms (saw live) he was SouL for BMPS 2022 — Liquipedia's
    // Entity 2022–23 entry is wrong. SouL 2022-03-04→2024-11-08.
    hector: [
      { externalOrg: 'Team Faceless', role: 'PLAYER', joinedAt: '2021-10-01', leftAt: '2021-12-04', note: APPROX },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2022-03-04', leftAt: '2024-11-08' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-11-08', leftAt: '2025-02-03' },
      { externalOrg: 'Likitha Esports', role: 'PLAYER', joinedAt: '2025-02-03', leftAt: '2025-04-29' },
      { externalOrg: 'Vasista Esports', role: 'PLAYER', joinedAt: '2025-05-05' },
    ],
    ayogi: [
      { externalOrg: 'Blind eSports', role: 'COACH', joinedAt: '2023-06-18', leftAt: '2023-11-02' },
      { externalOrg: 'Blind eSports', role: 'ANALYST', joinedAt: '2023-11-02', leftAt: '2023-12-24' },
      { orgSlug: 'soul', role: 'ANALYST', joinedAt: '2024-01-01', leftAt: '2025-07-28' },
      { orgSlug: 'soul', role: 'COACH', joinedAt: '2025-07-28' },
    ],
    // long-tail alumni — dated where known, else approximate with a note.
    // Manya: maker confirms SouL 2024–25 — Liquipedia mislabels it "Blind" (same
    // wrong-date pattern as Rony/Omega/Hector).
    manya: [
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2022-03-31', leftAt: '2023-03-29' },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-04-02', leftAt: '2023-12-24' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2024-01-01', leftAt: '2025-08-18' },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2025-09-17', leftAt: '2025-10-15' },
      { externalOrg: 'Wyld Fangs', role: 'PLAYER', joinedAt: '2025-10-15' },
    ],
    // Rony: maker confirms SouL Jan2024–Jul2025 — Liquipedia mislabels that period
    // as "Blind eSports" (same wrong-date pattern as Omega/Hector).
    rony: [
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-04-02', leftAt: '2023-12-24' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2024-01-01', leftAt: '2025-07-17' },
      { externalOrg: 'Revenant XSpark', role: 'PLAYER', joinedAt: '2025-07-23', leftAt: '2025-08-15' },
      { externalOrg: 'Team Versatile', role: 'PLAYER', joinedAt: '2025-08-16', leftAt: '2025-10-15' },
      { externalOrg: 'Meta Ninza', role: 'PLAYER', joinedAt: '2025-10-23', leftAt: '2025-11-15' },
      { externalOrg: 'True Rippers', role: 'PLAYER', joinedAt: '2025-12-12', leftAt: '2026-04-12' },
      { externalOrg: 'Vasista Esports', role: 'PLAYER', joinedAt: '2026-04-18' },
    ],
    spower: [
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2020-07-14', leftAt: '2020-08-31' },
      { externalOrg: 'Noble eSports', role: 'PLAYER', joinedAt: '2020-10-13', leftAt: '2021-06-01', note: APPROX },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2021-10-26', leftAt: '2022-09-14' },
      { externalOrg: 'GodL', role: 'CREATOR', joinedAt: '2022-09-14', leftAt: '2023-01-21' },
      { externalOrg: 'Blind eSports', role: 'PLAYER', joinedAt: '2023-01-21', leftAt: '2023-07-17' },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2023-07-19', leftAt: '2023-10-12' },
      { externalOrg: 'Blind eSports', role: 'PLAYER', joinedAt: '2023-10-12', leftAt: '2023-12-24' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2024-01-01', leftAt: '2024-07-12' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-08-12', leftAt: '2024-09-25' },
      { externalOrg: 'MOGO Esports', role: 'PLAYER', joinedAt: '2024-09-25', leftAt: '2024-10-07' },
      { externalOrg: 'Carnival Gaming', role: 'PLAYER', joinedAt: '2024-10-07', leftAt: '2024-11-08' },
      { externalOrg: 'Team Versatile', role: 'PLAYER', joinedAt: '2024-12-25', leftAt: '2025-05-14' },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2025-07-12', leftAt: '2025-07-17' },
    ],
    clutchgod: [
      { externalOrg: 'REVENGE ESPORTS', role: 'PLAYER', joinedAt: '2019-06-01', leftAt: '2019-10-20', note: APPROX },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2019-10-20', leftAt: '2019-12-01' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2019-12-01', leftAt: '2019-12-31' },
      { externalOrg: 'Entity Gaming', role: 'PLAYER', joinedAt: '2020-03-06', leftAt: '2021-07-22' },
      { externalOrg: 'TSM Entity', role: 'PLAYER', joinedAt: '2021-07-23', leftAt: '2021-08-26' },
      { externalOrg: 'Team TapaTap', role: 'PLAYER', joinedAt: '2021-08-26', leftAt: '2023-07-20' },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2023-07-20', leftAt: '2023-11-21' },
      { externalOrg: 'Numen Esports', role: 'PLAYER', joinedAt: '2024-01-12', leftAt: '2025-05-08' },
      { externalOrg: 'Gujarat Tigers', role: 'PLAYER', joinedAt: '2025-05-08', leftAt: '2025-08-16' },
      { externalOrg: 'Madkings Esports', role: 'PLAYER', joinedAt: '2025-08-16' },
    ],
    sangwan: [
      { externalOrg: 'FUNKY MONKEY', role: 'PLAYER', joinedAt: '2018-11-01', leftAt: '2019-01-01', note: APPROX },
      { externalOrg: 'Crawlers', role: 'PLAYER', joinedAt: '2019-01-01', leftAt: '2019-06-01', note: APPROX },
      { externalOrg: 'VSG Crawlers', role: 'PLAYER', joinedAt: '2019-06-01', leftAt: '2020-01-01', note: APPROX },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2020-01-17', leftAt: '2020-11-17' },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2020-12-11', leftAt: '2022-06-24' },
      { externalOrg: 'Rivalry Esports', role: 'PLAYER', joinedAt: '2022-06-24', leftAt: '2022-07-31' },
      { externalOrg: 'Higgboson Esports', role: 'COACH', joinedAt: '2025-11-25' },
    ],
    blaezi: [{ orgSlug: 'soul', role: 'PLAYER', joinedAt: '2020-07-09', leftAt: '2020-09-29' }],
    mavi: [
      { externalOrg: 'INDIAN TIGERS', role: 'PLAYER', joinedAt: '2019-05-01', leftAt: '2019-08-08' },
      { externalOrg: 'OREsports', role: 'PLAYER', joinedAt: '2019-08-28', leftAt: '2021-05-08' },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-07-07', leftAt: '2021-10-17' },
      { externalOrg: 'TeamXSpark', role: 'PLAYER', joinedAt: '2021-10-17', leftAt: '2022-08-24' },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-06-04', leftAt: '2024-10-08' },
      { orgSlug: 's8ul', role: 'CREATOR', joinedAt: '2024-10-08', note: APPROX },
    ],
    roxx: [
      { externalOrg: 'Celtz', role: 'PLAYER', joinedAt: '2019-12-01', leftAt: '2020-07-03', note: APPROX },
      { externalOrg: 'Galaxy Racer', role: 'PLAYER', joinedAt: '2020-07-03', leftAt: '2021-09-16' },
      { externalOrg: 'Nigma Galaxy', role: 'PLAYER', joinedAt: '2021-09-16', leftAt: '2021-10-15', note: APPROX },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-11-01', leftAt: '2022-01-13' },
    ],
    viru: [
      { externalOrg: 'ZFX Evolution', role: 'PLAYER', joinedAt: '2019-01-01', leftAt: '2019-06-15', note: APPROX },
      { externalOrg: 'Entity Gaming', role: 'PLAYER', joinedAt: '2019-06-15', leftAt: '2019-12-01', note: APPROX },
      { externalOrg: 'Seven Seas', role: 'PLAYER', joinedAt: '2019-12-01', leftAt: '2020-04-21', note: APPROX },
      { externalOrg: 'OREsports', role: 'PLAYER', joinedAt: '2020-06-21', leftAt: '2021-05-09' },
      { externalOrg: 'Red owl Gaming', role: 'PLAYER', joinedAt: '2021-05-15', leftAt: '2021-08-17' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2021-09-03', leftAt: '2021-10-03' },
      { externalOrg: 'Chemin Esports', role: 'PLAYER', joinedAt: '2021-10-03', leftAt: '2021-11-07' },
      { orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-11-01', leftAt: '2022-01-13' },
      { externalOrg: 'TeamXSpark', role: 'PLAYER', joinedAt: '2022-01-24', leftAt: '2022-02-07' },
      { externalOrg: 'GodLike Esports', role: 'PLAYER', joinedAt: '2022-02-08', leftAt: '2023-06-21' },
      { externalOrg: 'True Rippers', role: 'PLAYER', joinedAt: '2023-06-21', leftAt: '2023-07-29' },
    ],
    yuvaop: [{ orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-01-01', leftAt: '2022-01-01', note: APPROX }],
    deathnote: [{ orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-11-01', leftAt: '2022-01-13' }],
    ninjajod: [{ orgSlug: 'soul', role: 'PLAYER', joinedAt: '2021-01-01', leftAt: '2021-12-01', note: APPROX }],
    sid: [{ orgSlug: 'soul', role: 'MANAGER', joinedAt: '2023-01-01' }],
    mayavi: [{ orgSlug: 'soul', role: 'COACH', joinedAt: '2024-01-01', leftAt: '2025-07-01' }],
    amit: [{ orgSlug: 'soul', role: 'COACH', joinedAt: '2022-01-01', leftAt: '2023-01-01', note: APPROX }],

    // — 8Bit (BGMI), exact dates from Liquipedia unless noted —
    // Team iQOO 8Bit current roster — full careers from Liquipedia (Juicy = no
    // page yet; Shorty 404 → family-only for now).
    beg4mercy: [
      { externalOrg: '8BITRAMPAGE', role: 'PLAYER', joinedAt: '2019-06-01', leftAt: '2020-03-21', note: APPROX },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2020-03-21', leftAt: '2022-02-28' },
      { orgSlug: '8bit', role: 'OWNER', joinedAt: '2022-04-17' },
    ],
    sarang: [
      { externalOrg: 'Hydra', role: 'PLAYER', joinedAt: '2020-06-23', leftAt: '2020-07-31' },
      { externalOrg: '7Sea Esports', role: 'PLAYER', joinedAt: '2021-07-18', leftAt: '2023-03-01', note: APPROX },
      { externalOrg: 'Genesis Esports', role: 'PLAYER', joinedAt: '2023-03-11', leftAt: '2023-05-30' },
      { externalOrg: 'Revenant XSpark', role: 'PLAYER', joinedAt: '2023-06-04', leftAt: '2025-08-15' },
      { externalOrg: 'Team Versatile', role: 'PLAYER', joinedAt: '2025-10-15', leftAt: '2025-10-20' },
      { orgSlug: '8bit', teamSlug: 'team-iqoo-8bit', role: 'PLAYER', joinedAt: '2025-10-20' },
    ],
    juicy: [{ orgSlug: '8bit', teamSlug: 'team-iqoo-8bit', role: 'PLAYER', joinedAt: '2025-10-21' }],
    skipz: [
      { externalOrg: 'TEAM iNSANE', role: 'PLAYER', joinedAt: '2022-07-25', leftAt: '2023-11-09' },
      { externalOrg: 'Blind eSports', role: 'PLAYER', joinedAt: '2024-01-17', leftAt: '2024-06-12' },
      { externalOrg: 'Gujarat Tigers', role: 'PLAYER', joinedAt: '2024-07-17', leftAt: '2024-10-09' },
      { orgSlug: 'soul', teamSlug: 'team-iqoosoul', role: 'PLAYER', joinedAt: '2025-01-10', leftAt: '2025-02-03' },
      { externalOrg: 'TEAM iNSANE', role: 'PLAYER', joinedAt: '2025-07-21', leftAt: '2025-10-21' },
      { orgSlug: '8bit', teamSlug: 'team-iqoo-8bit', role: 'PLAYER', joinedAt: '2025-10-21' },
    ],
    shorty: [{ orgSlug: '8bit', teamSlug: 'team-iqoo-8bit', role: 'PLAYER', joinedAt: '2026-04-26' }],
    shubh: [
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2024-12-27', leftAt: '2025-05-06' },
      { externalOrg: 'Reckoning Esports', role: 'PLAYER', joinedAt: '2025-05-06', leftAt: '2025-07-11' },
      { externalOrg: 'Cincinnati Kids', role: 'PLAYER', joinedAt: '2025-07-11', leftAt: '2025-09-20' },
      { externalOrg: 'Reckoning Esports', role: 'PLAYER', joinedAt: '2025-09-20', leftAt: '2025-12-19' },
      { externalOrg: '4TR Official', role: 'PLAYER', joinedAt: '2025-12-19', leftAt: '2026-04-18' },
      { orgSlug: '8bit', teamSlug: 'team-iqoo-8bit', role: 'PLAYER', joinedAt: '2026-04-30' },
    ],
    madman: [
      { externalOrg: 'Marcos Gaming', role: 'PLAYER', joinedAt: '2022-04-18', leftAt: '2022-07-21' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2022-07-21', leftAt: '2024-12-03' },
    ],
    mighty: [
      { externalOrg: 'Chemin Esports', role: 'PLAYER', joinedAt: '2021-10-03', leftAt: '2022-03-01', note: APPROX },
      { externalOrg: 'REVENGE ESPORTS', role: 'PLAYER', joinedAt: '2022-03-01', leftAt: '2022-05-01', note: APPROX },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2023-07-25', leftAt: '2024-12-03' },
      { externalOrg: 'Cincinnati Kids', role: 'PLAYER', joinedAt: '2024-12-09', leftAt: '2025-07-11' },
    ],
    '8bit-beast': [
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2022-06-01', leftAt: '2023-11-05', note: APPROX },
      { externalOrg: 'Global Esports', role: 'PLAYER', joinedAt: '2023-11-05', leftAt: '2024-06-01', note: APPROX },
    ],
    ultron: [
      { externalOrg: 'Element Esports', role: 'PLAYER', joinedAt: '2020-02-02', leftAt: '2020-07-05' },
      { externalOrg: 'Galaxy Racer', role: 'PLAYER', joinedAt: '2020-07-05', leftAt: '2021-09-16' },
      { externalOrg: 'Nigma Galaxy', role: 'PLAYER', joinedAt: '2021-09-16', leftAt: '2021-12-02' },
      { externalOrg: 'TeamXSpark', role: 'PLAYER', joinedAt: '2021-12-02', leftAt: '2022-01-19' },
      { externalOrg: 'TeamXSpark', role: 'PLAYER', joinedAt: '2022-04-02', leftAt: '2022-06-01', note: APPROX },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2022-06-01', leftAt: '2023-06-12' },
      { externalOrg: 'Hyderabad Hydras', role: 'PLAYER', joinedAt: '2023-07-10', leftAt: '2023-11-09' },
    ],
    raiden: [
      { externalOrg: 'WSB Gaming', role: 'PLAYER', joinedAt: '2023-07-27', leftAt: '2024-06-18' },
      { externalOrg: 'TWOB', role: 'PLAYER', joinedAt: '2024-06-18', leftAt: '2024-07-08' },
      { externalOrg: 'Entity', role: 'PLAYER', joinedAt: '2024-07-08', leftAt: '2024-08-16' },
      { externalOrg: 'Team Versatile', role: 'PLAYER', joinedAt: '2024-08-20', leftAt: '2025-05-19' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2025-05-19', leftAt: '2026-03-16' },
      { externalOrg: 'Team Aryan', role: 'PLAYER', joinedAt: '2026-04-29' },
    ],
    termi: [
      { externalOrg: 'Hyderabad Hydras', role: 'PLAYER', joinedAt: '2024-08-24', leftAt: '2024-12-03' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2024-12-03', leftAt: '2025-05-17' },
      { externalOrg: 'Medal Esports', role: 'PLAYER', joinedAt: '2025-07-19', leftAt: '2025-10-03' },
      { externalOrg: 'Meta Ninza', role: 'PLAYER', joinedAt: '2025-10-23', leftAt: '2025-11-26' },
      { externalOrg: 'Learn From Past', role: 'PLAYER', joinedAt: '2026-01-02', leftAt: '2026-03-31' },
      { externalOrg: 'True Rippers', role: 'PLAYER', joinedAt: '2026-05-03' },
    ],
    insidious: [
      { externalOrg: 'Team iFlicks', role: 'PLAYER', joinedAt: '2024-01-01', leftAt: '2024-03-09', note: APPROX },
      { externalOrg: 'Hyderabad Hydras', role: 'PLAYER', joinedAt: '2024-03-09', leftAt: '2025-07-22' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2025-07-22', leftAt: '2025-09-18' },
      { externalOrg: 'First Curiosity', role: 'PLAYER', joinedAt: '2025-09-18', leftAt: '2025-10-15' },
      { externalOrg: 'Reckoning Esports', role: 'PLAYER', joinedAt: '2025-11-17', leftAt: '2025-12-15' },
      { externalOrg: 'Vanguard Esports', role: 'PLAYER', joinedAt: '2025-12-19', leftAt: '2026-03-31' },
      { externalOrg: 'Carpe Diem', role: 'PLAYER', joinedAt: '2026-04-28' },
    ],
    sheek: [
      { externalOrg: 'Team Versatile', role: 'PLAYER', joinedAt: '2025-01-12', leftAt: '2025-05-19' },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2025-05-19', leftAt: '2025-09-16' },
      { orgSlug: 's8ul', role: 'CREATOR', joinedAt: '2025-09-10', leftAt: '2025-09-16' },
      { externalOrg: 'GENxFM Esports', role: 'PLAYER', joinedAt: '2025-09-18', leftAt: '2025-11-11' },
      { externalOrg: 'White Walkers', role: 'PLAYER', joinedAt: '2025-11-11', leftAt: '2026-03-31' },
    ],
    '8bit-ash': [{ orgSlug: '8bit', role: 'PLAYER', joinedAt: '2019-06-14', leftAt: '2019-12-31', note: APPROX }],
    tsunami: [
      { externalOrg: 'REVENGE ESPORTS', role: 'PLAYER', joinedAt: '2020-03-19', leftAt: '2021-09-01', note: APPROX },
      { externalOrg: 'Rivalry Esports', role: 'PLAYER', joinedAt: '2021-09-01', leftAt: '2022-01-01', note: APPROX },
      { orgSlug: '8bit', role: 'PLAYER', joinedAt: '2022-04-18', leftAt: '2022-05-27' },
      { externalOrg: 'TEAM iNSANE', role: 'PLAYER', joinedAt: '2022-06-10', leftAt: '2023-06-21' },
      { externalOrg: 'Gujarat Tigers', role: 'PLAYER', joinedAt: '2023-06-21', leftAt: '2023-10-11' },
    ],
    // Omega/AkshaT/Spower/VIRU/ClutchGod/Owais 8Bit stints live on their merged
    // SouL member entries above (two-org tenures), not under `8bit-…` keys.
    surya: [
      { externalOrg: 'Zero Degree Esports', role: 'PLAYER', joinedAt: '2019-12-26', leftAt: '2021-11-05' },
      { externalOrg: 'Marcos Gaming', role: 'PLAYER', joinedAt: '2021-11-28', leftAt: '2022-06-01', note: APPROX },
      { orgSlug: '8bit', role: 'COACH', joinedAt: '2023-08-01', leftAt: '2024-06-01', note: APPROX },
    ],
    iflicks: [{ orgSlug: '8bit', role: 'COACH', joinedAt: '2020-07-14', leftAt: '2020-08-24' }],
  }

  for (const slug of Object.keys(TENURES)) {
    const memberId = memberBySlug[slug]
    if (!memberId) continue
    for (const t of TENURES[slug]) {
      const orgId = t.orgSlug ? orgBySlug[t.orgSlug] : undefined
      const teamId = t.teamSlug ? teamBySlug[t.teamSlug] : undefined
      // Dedupe key: member + start month + the place (family org OR external club).
      const placeClause = orgId
        ? { org: { equals: orgId } }
        : { externalOrg: { equals: t.externalOrg } }
      await createIfAbsent(
        payload,
        'tenures',
        { and: [{ member: { equals: memberId } }, placeClause, { joinedAt: { equals: t.joinedAt } }] },
        {
          member: memberId,
          ...(orgId ? { org: orgId } : {}),
          ...(t.externalOrg ? { externalOrg: t.externalOrg } : {}),
          ...(t.externalUrl ? { externalUrl: t.externalUrl } : {}),
          ...(teamId ? { team: teamId } : {}),
          role: t.role,
          joinedAt: t.joinedAt,
          ...(t.leftAt ? { leftAt: t.leftAt } : {}),
          ...(t.isFounding ? { isFounding: true } : {}),
          ...(t.note ? { note: t.note } : {}),
        },
      )
    }
  }

  // ── Achievements (createIfAbsent by slug, with links) ───
  interface AchSeed {
    slug: string
    year: string
    title: string
    category: string
    sortKey: number
    description: string
    type?: 'Team' | 'Individual'
    placement?: string
    orgSlug?: string
    gameSlug?: string
    teamSlug?: string
    memberSlugs?: string[]
  }
  const achievements: AchSeed[] = [
    { slug: 'bgis-2026-champions', year: '2026', title: 'BGIS 2026 Champions', category: 'BGMI', sortKey: 202602,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi', teamSlug: 'team-iqoosoul',
      memberSlugs: ['nakul', 'goblin', 'legit', 'jokerr', 'thunder'],
      description: 'Team iQOOSouL lifts the BGIS grand-final trophy in Chennai before a record 577K peak viewers.' },
    { slug: 'bmps-2022-champions', year: '2022', title: 'BMPS 2022 Champions', category: 'BGMI', sortKey: 202201,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi', teamSlug: 'team-iqoosoul',
      memberSlugs: ['akshat', 'hector', 'omega', 'goblin', 'mortal', 'viper'],
      description: 'Team SouL wins the Battlegrounds Mobile Pro Series 2022 — the squad’s marquee BGMI title. Roster: AkshaT, Hector, Omega, Goblin, MortaL & VipeR, coached by Amit.' },
    { slug: 'pmis-2019-champions', year: '2019', title: 'PMIS 2019 Champions', category: 'PUBGM', sortKey: 201901,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi',
      memberSlugs: ['mortal', 'viper', 'ronak', 'owais'],
      description: 'Team SouL’s founding line-up wins the PUBG Mobile India Series 2019.' },
    { slug: 'pmco-spring-india-2019', year: '2019', title: 'PMCO Spring India 2019 Champions', category: 'PUBGM', sortKey: 201902,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi',
      memberSlugs: ['mortal', 'viper', 'ronak', 'owais'],
      description: 'Team SouL wins the PUBG Mobile Club Open Spring Split (India) 2019.' },
    { slug: 'bgmi-masters-s3-2024', year: '2024', title: 'BGMI Masters Series S3 Champions', category: 'BGMI', sortKey: 202401,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi', teamSlug: 'team-iqoosoul',
      memberSlugs: ['nakul', 'rony', 'manya'],
      description: 'Team SouL lifts the BGMI Masters Series Season 3 title in 2024.' },
    { slug: 'cegc-2025', year: '2025', title: 'Chennai Esports Global Championship 2025', category: 'BGMI', sortKey: 202503,
      type: 'Team', placement: 'CHAMPION', orgSlug: 'soul', gameSlug: 'bgmi', teamSlug: 'team-iqoosoul',
      memberSlugs: ['nakul', 'goblin', 'legit', 'jokerr'],
      description: 'Team iQOOSouL wins the Chennai Esports Global Championship 2025.' },
    { slug: '8bit-ranbhoomi-s2-2023', year: '2023', title: 'Ranbhoomi Season 2 Champions', category: 'BGMI', sortKey: 202310,
      type: 'Team', placement: 'CHAMPION', orgSlug: '8bit', gameSlug: 'bgmi',
      memberSlugs: ['madman', 'mighty', '8bit-beast'],
      description: '8Bit wins Ranbhoomi Season 2 — the org’s first major BGMI title.' },
    { slug: '8bit-gauntlet-s2-2024', year: '2024', title: 'Gauntlet Season 2 Champions', category: 'BGMI', sortKey: 202410,
      type: 'Team', placement: 'CHAMPION', orgSlug: '8bit', gameSlug: 'bgmi',
      memberSlugs: ['madman', 'mighty'],
      description: '8Bit lifts the Gauntlet Season 2 trophy in 2024.' },
    { slug: '8bit-slayy-zone-2025', year: '2025', title: '1M Slayy Zone Champions', category: 'BGMI', sortKey: 202510,
      type: 'Team', placement: 'CHAMPION', orgSlug: '8bit', gameSlug: 'bgmi',
      description: 'Team iQOO 8Bit wins the 1M Slayy Zone in 2025.' },
    { slug: 'ewc-2026-partner', year: '2026', title: 'EWC 2026 Club Partner', category: 'EWC', sortKey: 202603,
      type: 'Team', orgSlug: 's8ul',
      description: 'Second straight year as one of 40 official Esports World Cup club partners, competing across 8+ titles in Paris.' },
    { slug: 'valorant-rebuild-2026', year: '2026', title: 'Valorant Rebuild', category: 'Valorant', sortKey: 202601,
      type: 'Team', orgSlug: 's8ul', gameSlug: 'valorant',
      description: 'A new-look Valorant roster led by SkRossi assembled for the 2026 season.' },
    { slug: 'ewc-2025-only-indian-org', year: '2025', title: 'EWC 2025 — Only Indian Org', category: 'EWC', sortKey: 202502,
      type: 'Team', orgSlug: 's8ul',
      description: 'The only Indian organisation at the 2025 Esports World Cup, fielding teams across eight titles.' },
    { slug: 'personality-2025', year: '2025', title: 'Esports Personality of the Year', category: 'Awards', sortKey: 202505,
      type: 'Individual', orgSlug: 's8ul', memberSlugs: ['8bit-thug'],
      description: 'Co-founder Animesh “8bit Thug” Agarwal wins Esports Personality of the Year at Esports Awards 2025.' },
    { slug: 'content-group-4x', year: '2025', title: '4× Content Group of the Year', category: 'Awards', sortKey: 202504,
      type: 'Team', orgSlug: 's8ul',
      description: 'First org to win Esports Content Group of the Year four years running (2022–2025), lifted in Las Vegas.' },
    { slug: 'mobies-2023', year: '2023', title: 'MOBIES Global Impact Award', category: 'Awards', sortKey: 202301,
      type: 'Team', orgSlug: 's8ul',
      description: 'First Indian esports org to win a MOBIES award for global impact in mobile gaming.' },
  ]
  for (const a of achievements) {
    const { orgSlug, gameSlug, teamSlug, memberSlugs, ...rest } = a
    await createIfAbsent(
      payload,
      'achievements',
      { slug: { equals: a.slug } },
      {
        ...rest,
        type: a.type ?? 'Team',
        ...(orgSlug ? { org: orgBySlug[orgSlug] } : {}),
        ...(gameSlug ? { game: gameBySlug[gameSlug] } : {}),
        ...(teamSlug ? { team: teamBySlug[teamSlug] } : {}),
        ...(memberSlugs ? { members: memberSlugs.map((s) => memberBySlug[s]).filter(Boolean) } : {}),
      },
    )
  }

  // ── Brands (createIfAbsent by slug) ─────────────────────
  const iqooLogo = path.join(publicDir, 's8ul-logo.webp') // placeholder mark until a real iQOO logo is added
  const BRANDS = [
    {
      slug: 'iqoo', name: 'iQOO', category: 'TITLE', status: 'ACTIVE', featured: true, sortKey: 100,
      orgSlugs: ['soul'], teamSlug: 'team-iqoosoul', startDate: '2023-01-01',
      url: 'https://www.iqoo.com/in',
      description: 'Title sponsor of Team iQOOSouL — naming-rights partner of the SouL BGMI squad.',
    },
  ]
  for (const b of BRANDS) {
    const { orgSlugs, teamSlug, ...rest } = b
    await createIfAbsent(
      payload,
      'brands',
      { slug: { equals: b.slug } },
      {
        ...rest,
        orgs: orgSlugs.map((s) => orgBySlug[s]),
        ...(teamSlug ? { team: teamBySlug[teamSlug] } : {}),
      },
    )
  }
  void iqooLogo

  // ── Founders (createIfAbsent by slug) ───────────────────
  const founders = [
    { slug: 'animesh-agarwal', name: 'Animesh Agarwal', alias: '8Bit Thug', order: 1,
      role: 'Founder & CEO, 8Bit Creatives',
      bio: 'Founder and CEO of 8Bit Creatives and S8UL — entrepreneur, ex-pro and a pioneer of the esports business in India. Named Esports Personality of the Year at Esports Awards 2025.' },
    { slug: 'naman-mathur', name: 'Naman Mathur', alias: 'MortaL', order: 2,
      role: 'Founder, Team SouL · Co-founder, S8UL',
      bio: 'The face of Indian esports and a four-time Esports Awards nominee — founder of Team SouL and a driving force behind S8UL’s rise.' },
    { slug: 'lokesh-jain', name: 'Lokesh Jain', alias: 'Goldy', order: 3,
      role: 'Co-founder, 8Bit Creatives & S8UL',
      bio: 'A co-founder with a business background, instrumental in nurturing talent and growing Indian esports.' },
    { slug: 'sumit-sovasaria', name: 'Sumit Sovasaria', order: 4,
      role: 'Co-founder, S8UL',
      bio: 'A co-founder and industrialist whose experience scaling businesses guides S8UL’s next phase of growth.' },
  ]
  for (const f of founders) {
    await createIfAbsent(payload, 'founders', { slug: { equals: f.slug } }, f)
  }

  // ── EWC 2026 fixtures (disposable → reset) ──────────────
  await reset(payload, 'matches')
  const matches = [
    { opponent: 'Team Falcons', competition: 'BGMI — Group Stage', game: 'BGMI', startsAt: '2026-07-08T16:00:00+04:00' },
    { opponent: 'ONIC', competition: 'MLBB — Group A', game: 'MLBB', startsAt: '2026-07-10T18:00:00+04:00' },
    { opponent: 'Cloud9', competition: 'CoD Warzone — R1', game: 'CoD', startsAt: '2026-07-12T20:00:00+04:00' },
    { opponent: 'GodLike', competition: 'BGMI — India Derby', game: 'BGMI', startsAt: '2026-07-15T16:00:00+04:00' },
    { opponent: 'Fnatic', competition: 'Tekken 8 — Group B', game: 'Tekken', startsAt: '2026-07-18T14:00:00+04:00' },
  ]
  for (const m of matches) {
    await payload.create({ collection: 'matches', data: { ...m, event: 'EWC 2026', status: 'UPCOMING' } as never })
  }

  // ── Navigation (header + footer menus + Partners) ───────
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: [
        { label: 'Players', href: '/players' },
        { label: 'Orgs', href: '/orgs' },
        { label: 'Partners', href: '/brands' },
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
            { label: 'Partners', href: '/brands' },
            { label: 'EWC 2026', href: '/ewc' },
            { label: 'Honours', href: '/achievements' },
          ],
        },
        { heading: 'Studio', links: [{ label: 'About', href: '/about' }] },
      ],
      social: [
        { platform: 'YouTube', url: 'https://youtube.com/@S8ULGG_' },
        { platform: 'Twitter', url: 'https://twitter.com/S8ulEsports' },
        { platform: 'Instagram', url: 'https://instagram.com/s8ul.esports/' },
      ],
      footerTagline: 'Where legends live.',
    } as never,
  })

  const tenureCount = Object.values(TENURES).reduce((n, arr) => n + arr.length, 0)
  payload.logger.info(
    `✅  Seeded ${allMembers.length} members · 4 orgs · ${TEAMS.length} teams · ~${tenureCount} tenures · ${achievements.length} honours · ${BRANDS.length} brand · ${founders.length} founders · ${matches.length} fixtures.`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
