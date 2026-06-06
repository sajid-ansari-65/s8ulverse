import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
} from 'payload'

// Purge the entire public site so admin edits appear immediately instead of
// waiting out the 1h ISR window. Broad on purpose: this is a low-traffic,
// curated site, and Globals (nav/footer/SEO) touch the shared layout on every
// page — over-invalidation is far cheaper than "I edited X but page Y is stale".
//
// Wrapped in try/catch so non-Next contexts (seed/one-off tsx scripts that call
// the Local API) no-op instead of throwing — revalidatePath needs a request.
function purge() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* not in a Next.js request — ignore */
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  purge()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  purge()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  purge()
  return doc
}

// Wrappers that append the revalidate hooks to a config (keeping any existing
// hooks) — applied once in payload.config.ts so individual files stay clean.
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
