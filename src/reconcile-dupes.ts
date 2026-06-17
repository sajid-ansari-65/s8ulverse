import 'dotenv/config'

import { getPayload, type CollectionSlug } from 'payload'

import config from './payload.config'

// One-time reconciliation: six players each appeared TWICE — once seeded under
// Team SouL and once (safety-prefixed `8bit-…`) when the 8Bit roster was loaded.
// Liquipedia confirms each is a SINGLE person with a multi-org career, so we
// MERGE: re-parent the duplicate's 8Bit tenure onto the canonical SouL member,
// fix the real name, correct the SouL stint dates, then delete the duplicate.
//
// Re-parent (not delete+reseed) on purpose: the canonical members carry winner
// links (Omega/AkshaT = BMPS 2022) that createIfAbsent would NOT restore.
// Idempotent — safe to re-run (a missing duplicate is simply skipped).

interface Merge {
  canonical: string // surviving member slug (the SouL record)
  dup: string // duplicate to absorb + delete
  realName: string
  soulFrom: string // authoritative SouL stint (Liquipedia)
  soulTo: string
}

const MERGES: Merge[] = [
  { canonical: 'omega', dup: '8bit-omega', realName: 'Sahil Jakhar', soulFrom: '2022-01-13', soulTo: '2023-12-23' },
  { canonical: 'akshat', dup: '8bit-akshat', realName: 'Akshat Goel', soulFrom: '2022-01-13', soulTo: '2023-12-23' },
  { canonical: 'spower', dup: '8bit-spower', realName: 'Rudra Banswani', soulFrom: '2024-01-01', soulTo: '2024-07-12' },
  { canonical: 'viru', dup: '8bit-viru', realName: 'Viren Mahipalsingh Gour', soulFrom: '2021-11-01', soulTo: '2022-01-13' },
  { canonical: 'clutchgod', dup: '8bit-clutchgod', realName: 'Vivek Aabhas Horo', soulFrom: '2019-10-20', soulTo: '2019-12-01' },
  { canonical: 'owais', dup: '8bit-owais', realName: 'Mohammed Owais Lakhani', soulFrom: '2018-12-21', soulTo: '2019-09-10' },
]

// SouL-only players whose real name / stint dates were approximate — now backfilled
// from Liquipedia (no 8Bit duplicate involved, so just patch the existing rows).
interface SoulFix {
  slug: string
  realName?: string
  from: string
  to: string
}
const SOUL_FIXES: SoulFix[] = [
  { slug: 'hector', realName: 'Sohail Shaikh', from: '2022-03-04', to: '2023-12-23' },
  { slug: 'sangwan', realName: 'Dhruv Sangwan', from: '2020-01-17', to: '2020-11-17' },
  { slug: 'mavi', realName: 'Harmandeep Singh', from: '2021-07-07', to: '2021-10-17' },
  { slug: 'roxx', realName: 'Yogesh Yadav', from: '2021-11-01', to: '2022-01-13' },
  { slug: 'deathnote', from: '2021-11-01', to: '2022-01-13' },
  { slug: 'blaezi', from: '2020-07-09', to: '2020-09-29' },
]

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('🔧  Reconciling 8Bit↔SouL duplicate players…')

  const idBySlug = async (collection: CollectionSlug, slug: string) => {
    const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    return docs[0]?.id as number | undefined
  }

  const soulId = await idBySlug('organizations', 'soul')

  const updateSoulTenure = async (memberId: number, from: string, to: string) => {
    const { docs } = await payload.find({
      collection: 'tenures',
      where: { and: [{ member: { equals: memberId } }, { org: { equals: soulId } }] },
      limit: 10,
      depth: 0,
    })
    for (const t of docs) {
      await payload.update({ collection: 'tenures', id: t.id, data: { joinedAt: from, leftAt: to } as never })
    }
  }

  for (const m of MERGES) {
    const canId = await idBySlug('members', m.canonical)
    if (!canId) {
      payload.logger.warn(`  ⚠  canonical '${m.canonical}' not found — skipping`)
      continue
    }
    const dupId = await idBySlug('members', m.dup)
    if (dupId) {
      // Re-parent every tenure on the duplicate onto the canonical member…
      const { docs: dupTenures } = await payload.find({
        collection: 'tenures',
        where: { member: { equals: dupId } },
        limit: 50,
        depth: 0,
      })
      for (const t of dupTenures) {
        await payload.update({ collection: 'tenures', id: t.id, data: { member: canId } as never })
      }
      // …then delete the now-empty duplicate (cleanup hook prunes any stray refs).
      await payload.delete({ collection: 'members', id: dupId })
      payload.logger.info(`  ✓ merged ${m.dup} → ${m.canonical} (${dupTenures.length} tenure(s) re-parented)`)
    } else {
      payload.logger.info(`  · ${m.dup} already merged`)
    }
    await payload.update({ collection: 'members', id: canId, data: { realName: m.realName } as never })
    await updateSoulTenure(canId, m.soulFrom, m.soulTo)
  }

  for (const f of SOUL_FIXES) {
    const id = await idBySlug('members', f.slug)
    if (!id) continue
    if (f.realName) await payload.update({ collection: 'members', id, data: { realName: f.realName } as never })
    await updateSoulTenure(id, f.from, f.to)
    payload.logger.info(`  ✓ patched ${f.slug}`)
  }

  payload.logger.info('✅  Reconciliation complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
