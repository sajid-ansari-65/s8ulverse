// Lightweight view-models for the public site. Kept independent of the
// generated `payload-types.ts` so pages stay decoupled from the CMS internals.

export interface MediaDoc {
  url?: string | null
  alt?: string | null
}

export interface Org {
  id: string
  name: string
  shortName?: string | null
  slug: string
  description?: string | null
  founded?: number | null
  isVerified?: boolean
  accentHex?: string | null
  logo?: MediaDoc | string | null
}

export interface Social {
  id?: string
  platform: string
  handle?: string | null
  url: string
  followers?: number | null
}

export interface CareerEntry {
  id?: string
  year: string
  title: string
  description?: string | null
}

export interface TeamDoc {
  id: string
  name: string
  game?: { name?: string | null } | string | null
}

export interface Member {
  id: string
  ign: string
  realName?: string | null
  slug: string
  role: string
  position?: string | null
  org: Org | string
  avatar?: MediaDoc | string | null
  banner?: MediaDoc | string | null
  bio?: string | null
  country?: string | null
  isVerified?: boolean
  joinedAt?: string | null
  socials?: Social[] | null
  career?: CareerEntry[] | null
  featuredYoutubeVideo?: string | null
  youtubeChannels?:
    | { label: string; handle: string; primary?: boolean | null; featuredVideo?: string | null }[]
    | null
  instagramPosts?: { url: string }[] | null
  teams?: (TeamDoc | string)[] | null
  metaTitle?: string | null
  metaDesc?: string | null
}

// Relationship/upload fields come back as either an id (string) or the populated
// object depending on query depth. These guards narrow safely.
export const asOrg = (v: Org | string | null | undefined): Org | null =>
  v && typeof v === 'object' ? v : null

export const mediaUrl = (v: MediaDoc | string | null | undefined): string | null =>
  v && typeof v === 'object' ? (v.url ?? null) : null
