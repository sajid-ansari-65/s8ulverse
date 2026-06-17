import 'dotenv/config'

import { getPayload } from 'payload'

import config from './payload.config'

// One-off backfill for the 2026/27 kit palette. `upsert` in seed.ts already
// writes these, but the full seed is heavy (image uploads + ~250 tenures); this
// just patches the four org rows in place so existing installs get kit colours
// without a full reseed.
//
// Usage:  npx tsx src/backfill-kits.ts
// Safe: only updates organizations by slug; no deletes, no cascades.

const KITS: Record<string, { kitPrimary: string; kitSecondary: string; kitMetal: string }> = {
  s8ul: { kitPrimary: '#1b6fff', kitSecondary: '#f4f7ff', kitMetal: '#16c79a' },
  soul: { kitPrimary: '#1b6fff', kitSecondary: '#f4f7ff', kitMetal: '#d4af37' },
  '8bit': { kitPrimary: '#1b6fff', kitSecondary: '#f4f7ff', kitMetal: '#6d28d9' },
  '8bit-creative': { kitPrimary: '#1b6fff', kitSecondary: '#f4f7ff', kitMetal: '#c8ccd4' },
}

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('🎨  Backfilling 2026/27 kit colours…')

  for (const [slug, kit] of Object.entries(KITS)) {
    const { docs } = await payload.find({
      collection: 'organizations',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const org = docs[0]
    if (!org) {
      payload.logger.warn(`  ⚠  org '${slug}' not found — skipped`)
      continue
    }
    await payload.update({ collection: 'organizations', id: org.id, data: kit as never })
    payload.logger.info(`  ✓  ${slug} → ${kit.kitPrimary} / ${kit.kitSecondary} / ${kit.kitMetal}`)
  }

  payload.logger.info('✅  Kit backfill complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
