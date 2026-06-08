import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
  Payload,
} from 'payload'

// Targeted revalidation (O4 / D-O2). A small edit→path matrix so a single content
// edit refreshes only the affected pages, not all 60+. Globals + near-static
// collections stay broad. ANY resolution failure → broad purge (never serve stale).
//
// Matrix:
//   Members      → /players/[slug], /players, /, every org in their tenures, +/brands if branded
//   Tenures      → the tenure's /orgs/[org] + /players/[member]
//   Achievements → linked /orgs/[org] + each linked /players/[member] + /achievements + /
//   Brands       → /brands + each linked /orgs/[org] + each linked /players/[member]
//   everything else (Orgs/Teams/Games/Founders/Matches/Pages, all globals) → broad
//   Member DELETE → broad (F11: cleanup deletes the tenures first, so the fan-out
//                   would find none and miss the org pages)

function broad() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* not in a Next.js request (seed/script) — ignore */
  }
}

function revalidateMany(paths: string[]) {
  try {
    for (const p of new Set(paths)) revalidatePath(p)
  } catch {
    /* not in a Next.js request — ignore */
  }
}

// Resolve a relationship value (id, or populated doc) to its slug.
async function slugOf(payload: Payload, collection: 'organizations' | 'members', value: unknown) {
  if (value == null) return null
  if (typeof value === 'object') {
    const o = value as { slug?: string; id?: unknown }
    if (o.slug) return o.slug
    value = o.id
  }
  try {
    const doc = await payload.findByID({ collection, id: value as number, depth: 0 })
    return (doc as { slug?: string }).slug ?? null
  } catch {
    return null
  }
}

async function slugsOf(payload: Payload, collection: 'organizations' | 'members', arr: unknown) {
  const out: string[] = []
  for (const v of (arr as unknown[]) ?? []) {
    const s = await slugOf(payload, collection, v)
    if (s) out.push(s)
  }
  return out
}

type Doc = Record<string, unknown> & { id: number | string; slug?: string }

// Per-collection targeted resolvers. Absent slug ⇒ caller falls back to broad.
const RESOLVERS: Record<string, (doc: Doc, payload: Payload) => Promise<string[]>> = {
  members: async (doc, payload) => {
    const paths = ['/players', '/']
    if (doc.slug) paths.push(`/players/${doc.slug}`)
    // An alumnus appears on EVERY org legacy page they had a tenure on.
    const tenures = await payload.find({
      collection: 'tenures',
      where: { member: { equals: doc.id } },
      depth: 0,
      limit: 1000,
    })
    for (const t of tenures.docs) {
      const s = await slugOf(payload, 'organizations', (t as { org?: unknown }).org)
      if (s) paths.push(`/orgs/${s}`)
    }
    const branded = await payload.find({
      collection: 'brands',
      where: { members: { in: [doc.id] } },
      depth: 0,
      limit: 1,
    })
    if (branded.totalDocs > 0) paths.push('/brands')
    return paths
  },
  tenures: async (doc, payload) => {
    const paths: string[] = []
    const m = await slugOf(payload, 'members', doc.member)
    if (m) paths.push(`/players/${m}`)
    const o = await slugOf(payload, 'organizations', doc.org)
    if (o) paths.push(`/orgs/${o}`)
    return paths
  },
  achievements: async (doc, payload) => {
    const paths = ['/achievements', '/']
    const o = await slugOf(payload, 'organizations', doc.org)
    if (o) paths.push(`/orgs/${o}`)
    for (const s of await slugsOf(payload, 'members', doc.members)) paths.push(`/players/${s}`)
    return paths
  },
  brands: async (doc, payload) => {
    const paths = ['/brands']
    for (const s of await slugsOf(payload, 'organizations', doc.orgs)) paths.push(`/orgs/${s}`)
    for (const s of await slugsOf(payload, 'members', doc.members)) paths.push(`/players/${s}`)
    return paths
  },
}

async function runTargeted(slug: string, doc: Doc, payload: Payload) {
  const resolver = RESOLVERS[slug]
  if (!resolver) return broad() // near-static collection → broad purge
  try {
    const paths = await resolver(doc, payload)
    if (paths.length) revalidateMany(paths)
    else broad()
  } catch {
    broad() // safety fallback — never serve stale
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc, collection, req }) => {
  await runTargeted(collection.slug, doc as Doc, req.payload)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, collection, req }) => {
  // Member delete = broad (F11): the E5 cleanup hook deletes the member's tenures
  // before this runs, so a targeted fan-out would find no orgs.
  if (collection.slug === 'members') {
    broad()
    return doc
  }
  await runTargeted(collection.slug, doc as Doc, req.payload)
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  broad() // globals touch the shared layout → broad
  return doc
}

// Wrappers that append the revalidate hooks to a config (keeping any existing
// hooks — e.g. the E5 cleanup afterDelete runs first, then revalidate).
export const withRevalidate = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  hooks: {
    ...c.hooks,
    afterChange: [...(c.hooks?.afterChange ?? []), revalidateAfterChange],
    afterDelete: [...(c.hooks?.afterDelete ?? []), revalidateAfterDelete],
  },
})

export const withGlobalRevalidate = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  hooks: {
    ...g.hooks,
    afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobalAfterChange],
  },
})
