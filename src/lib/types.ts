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
  // Org detail header (G2) — these columns already exist on the collection.
  banner?: MediaDoc | string | null
  website?: string | null
  twitter?: string | null
  instagram?: string | null
  youtube?: string | null
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

export interface GameDoc {
  name: string
  slug: string
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

// One stint at one org. The raw shape behind legacy rosters + profile timelines.
export interface Tenure {
  id?: string
  member: Member | string
  org: Org | string
  team?: TeamDoc | string | null
  role: string
  joinedAt: string // ISO; render month+year
  leftAt?: string | null // blank = current
  isFounding?: boolean | null
  note?: string | null
}

// A member merged across all their stints at ONE org (rejoins collapsed) —
// what a legacy-roster card renders.
export interface RosterMember {
  member: Member
  joinedAt: string // earliest stint at this org
  leftAt?: string | null // latest exit, or null if any stint is open
  isCurrent: boolean
  isFounding: boolean
  roleAtOrg: string
  team?: TeamDoc | null
  stints: Tenure[] // raw rows, for "2019–20 · 2022–present" display
}

// Trophy / award. `type` drives where it shows (Team → org timeline,
// Individual → player). `status`/`placement`/`category` map from stored enums.
export interface Achievement {
  id?: string
  title: string
  slug: string
  year: string
  category?: string | null
  description?: string | null
  type: 'Team' | 'Individual'
  placement?: string | null
  org?: Org | string | null
  team?: TeamDoc | string | null
  game?: GameDoc | string | null
  members?: (Member | string)[] | null
}

// Brand / sponsor partnership. `status` is the friendly form; readers map the
// stored ACTIVE/PAST enum to this.
export interface Brand {
  id?: string
  name: string
  slug: string
  logo?: MediaDoc | string | null
  category: string
  status: 'Active' | 'Past'
  orgs: (Org | string)[]
  members?: (Member | string)[] | null
  team?: TeamDoc | string | null
  game?: GameDoc | string | null
  startDate?: string | null
  endDate?: string | null
  description?: string | null
  url?: string | null
  featured?: boolean | null
}

// Relationship/upload fields come back as either an id (string) or the populated
// object depending on query depth. These guards narrow safely.
export const asOrg = (v: Org | string | null | undefined): Org | null =>
  v && typeof v === 'object' ? v : null

export const mediaUrl = (v: MediaDoc | string | null | undefined): string | null =>
  v && typeof v === 'object' ? (v.url ?? null) : null

export const asTeam = (v: TeamDoc | string | null | undefined): TeamDoc | null =>
  v && typeof v === 'object' ? v : null

export const asGame = (v: GameDoc | string | null | undefined): GameDoc | null =>
  v && typeof v === 'object' ? v : null

export const asMember = (v: Member | string | null | undefined): Member | null =>
  v && typeof v === 'object' ? v : null

// Turn a hasMany relationship — `(T | string)[] | null` — into populated `T[]`,
// dropping bare id strings. This is also what makes E5's dangling refs invisible:
// a deleted ref comes back as an id and is filtered out here.
export const resolveMany = <T,>(v: (T | string)[] | null | undefined): T[] =>
  (v ?? []).filter((x): x is T => typeof x === 'object' && x !== null)
