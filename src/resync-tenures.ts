import 'dotenv/config'

import { getPayload } from 'payload'

import config from './payload.config'

// Resync helper for the per-player timeline pass. When a player's family stint
// DATES change (not just new external rows), createIfAbsent can't update the
// existing tenure — and a changed joinedAt would create a DUPLICATE. So for any
// member whose timeline was rewritten, delete their tenures here, then re-run
// `npm run seed` to rebuild them from the corrected seed.
//
// Usage:  npx tsx src/resync-tenures.ts <slug> [slug...]
// Safe: only touches tenures of the named members (no admin tenure edits exist
// yet); deleting a tenure fires no cascade (cleanup hooks live on Members/Orgs).

const run = async () => {
  const slugs = process.argv.slice(2)
  if (!slugs.length) {
    console.error('Pass one or more member slugs, e.g. npx tsx src/resync-tenures.ts goblin jokerr')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  payload.logger.info(`🧹  Resyncing tenures for: ${slugs.join(', ')}`)

  for (const slug of slugs) {
    const { docs } = await payload.find({
      collection: 'members',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const member = docs[0]
    if (!member) {
      payload.logger.warn(`  ⚠  member '${slug}' not found`)
      continue
    }
    const del = await payload.delete({
      collection: 'tenures',
      where: { member: { equals: member.id } },
    })
    const count = Array.isArray(del?.docs) ? del.docs.length : 0
    payload.logger.info(`  ✓ ${slug}: deleted ${count} tenure(s)`)
  }

  payload.logger.info('✅  Resync done — now run `npm run seed` to rebuild.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
