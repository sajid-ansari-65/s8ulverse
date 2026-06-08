// Display-only label maps (D-F2). Collection `options` stay inline in each
// collection (house style — `Member.role` is NOT refactored); this file only
// turns stored enum codes into human labels for the frontend. Components import
// the maps and fall back to the raw value when a key is missing (`MAP[v] ?? v`).

export const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Player',
  CREATOR: 'Creator',
  COACH: 'Coach',
  ANALYST: 'Analyst',
  MANAGER: 'Manager',
  OWNER: 'Owner',
}

export const PLACEMENT_LABELS: Record<string, string> = {
  CHAMPION: 'Champion',
  RUNNER_UP: 'Runner-up',
  TOP_3: 'Top 3',
  QUALIFIED: 'Qualified',
}

export const ACH_TYPE_LABELS: Record<string, string> = {
  Team: 'Team',
  Individual: 'Individual',
}

export const BRAND_CATEGORY_LABELS: Record<string, string> = {
  TITLE: 'Title / Naming Rights',
  SPONSOR: 'Sponsor',
  AMBASSADOR: 'Ambassador',
  COLLABORATION: 'Collaboration',
  MERCH: 'Merch',
  CAMPAIGN: 'Campaign',
  EVENT: 'Event',
}

export const BRAND_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAST: 'Past',
}

// Non-playing roles — used to bucket a roster into players vs staff (E4).
export const STAFF_ROLES = ['COACH', 'ANALYST', 'MANAGER'] as const

/** `MAP[value] ?? value` — safe label lookup with raw fallback. */
export const labelFor = (map: Record<string, string>, value: string): string =>
  map[value] ?? value

// Dev-only drift guard (D-F2). `Tenure.role` and `Member.role` are maintained as
// two separate inline enums; this warns if either grows a value that has no label
// here (or if a STAFF_ROLE isn't a known role) — catches drift without a refactor.
if (process.env.NODE_ENV !== 'production') {
  const ROLE_VALUES = ['PLAYER', 'CREATOR', 'COACH', 'ANALYST', 'MANAGER', 'OWNER']
  for (const r of ROLE_VALUES) {
    if (!ROLE_LABELS[r]) console.warn(`[labels] ROLE_LABELS is missing a label for role "${r}"`)
  }
  for (const r of STAFF_ROLES) {
    if (!ROLE_LABELS[r]) console.warn(`[labels] STAFF_ROLES value "${r}" is not in ROLE_LABELS`)
  }
}
