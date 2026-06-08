import type { Achievement, Member, RosterMember, Tenure } from './types'
import { asMember, asTeam, resolveMany } from './types'
import { STAFF_ROLES } from './labels'

// Merge a member's tenure rows AT ONE ORG into a single roster entry, collapsing
// rejoins (e.g. Goblin 2022–24 + 2025–present → one card with both stints). Rows
// must already be scoped to the org. Returns null if the member can't be resolved.
export function asRosterMember(rows: Tenure[]): RosterMember | null {
  if (!rows.length) return null
  const member = asMember(rows[0].member)
  if (!member) return null

  const sorted = [...rows].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
  )
  const isCurrent = sorted.some((s) => !s.leftAt)
  // current-else-latest stint drives the displayed role + squad
  const pick = sorted.find((s) => !s.leftAt) ?? sorted[sorted.length - 1]

  return {
    member,
    joinedAt: sorted[0].joinedAt,
    leftAt: isCurrent ? null : (sorted[sorted.length - 1].leftAt ?? null),
    isCurrent,
    isFounding: sorted.some((s) => Boolean(s.isFounding)),
    roleAtOrg: pick.role,
    team: asTeam(pick.team ?? null),
    stints: sorted,
  }
}

// Group raw tenure rows (already scoped to an org) by member → RosterMember[].
export function buildRoster(rows: Tenure[]): RosterMember[] {
  const byMember = new Map<string, Tenure[]>()
  for (const t of rows) {
    const m = asMember(t.member)
    const id = m ? String(m.id) : typeof t.member === 'string' ? t.member : null
    if (!id) continue
    const list = byMember.get(id) ?? []
    list.push(t)
    byMember.set(id, list)
  }
  return [...byMember.values()]
    .map(asRosterMember)
    .filter((r): r is RosterMember => r !== null)
}

export interface GroupedRoster {
  current: RosterMember[] // active players/creators
  alumni: RosterMember[] // departed (no open stint)
  staff: RosterMember[] // coach / analyst / manager (current or past)
  owners: RosterMember[] // OWNER role — surfaced as leadership, NOT in the roster list (H)
}

// Bucket a roster for the legacy page (E4): owners pulled out for the leadership
// line, staff split by role, the rest by whether they have an open stint.
export function groupRoster(roster: RosterMember[]): GroupedRoster {
  const owners: RosterMember[] = []
  const staff: RosterMember[] = []
  const current: RosterMember[] = []
  const alumni: RosterMember[] = []
  for (const r of roster) {
    if (r.roleAtOrg === 'OWNER') owners.push(r)
    else if ((STAFF_ROLES as readonly string[]).includes(r.roleAtOrg)) staff.push(r)
    else if (r.isCurrent) current.push(r)
    else alumni.push(r)
  }
  return { current, alumni, staff, owners }
}

// ─── Honours ────────────────────────────────────────────────────────────────

// Split a member's honours into Team vs Individual (player profile page).
export function splitHonours(list: Achievement[]): {
  team: Achievement[]
  individual: Achievement[]
} {
  const team: Achievement[] = []
  const individual: Achievement[] = []
  for (const a of list) (a.type === 'Individual' ? individual : team).push(a)
  return { team, individual }
}

// Build `memberId → achievements they're credited on` from ONE org's achievement
// list — lets each roster card show its honour count/chips without an N+1 query.
export function memberHonourMap(list: Achievement[]): Map<string, Achievement[]> {
  const map = new Map<string, Achievement[]>()
  for (const a of list) {
    for (const m of resolveMany<Member>(a.members ?? null)) {
      const id = String(m.id)
      const arr = map.get(id) ?? []
      arr.push(a)
      map.set(id, arr)
    }
  }
  return map
}
