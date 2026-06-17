# Deep-dive E — Readers, view types & delete-integrity

Status: **DESIGN LOCKED** (agenda item E of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Consolidates the reader/type sketches from A, C, D into one coherent layer, and
resolves the cross-cutting delete-integrity thread.
Locked: **D-E1** transforms in new `src/lib/roster.ts` · **D-E2** full `afterDelete`
cleanup hooks on Members + Organizations + Teams.

---

## E0. Conventions to match (verified)

- **No mapper functions.** Readers do `payload.find(...)` then
  `return docs as unknown as ViewType[]`. View interfaces in `src/lib/types.ts` are
  structurally compatible with populated docs; **relationship/upload fields are
  narrowed at render** via `asOrg(v)` / `mediaUrl(v)` / `typeof v === 'object'`.
- **Depth conventions:** list views `depth: 1`; detail (member) `depth: 2`;
  lightweight strips `depth: 0`.
- **All readers live in `src/lib/data.ts`**, one file. IDs are Postgres serial →
  view types use `id: string` and rely on the cast (existing inline types use
  `string | number`).

E mostly follows this, with **one justified departure**: roster/honours need real
**aggregation** (group tenures by member, split honours), which a cast can't do →
small **pure transform helpers** (E4). Everything else stays cast-and-narrow.

---

## E1. New view types  → `src/lib/types.ts`

Consolidated from A §A8, C §C5, D §D4 (style matches existing: `id: string`,
relationships as `X | string`, nullable optionals):

```ts
export interface GameDoc { id: string; name: string; slug: string; logo?: MediaDoc | string | null }

export interface Tenure {
  id: string
  member: Member | string
  org: Org | string
  team?: TeamDoc | string | null
  role: string
  joinedAt: string            // ISO; render month+year
  leftAt?: string | null
  isFounding?: boolean | null
  note?: string | null
}

export interface RosterMember {       // derived (E4), not a raw doc
  member: Member
  joinedAt: string
  leftAt?: string | null
  isCurrent: boolean
  isFounding: boolean
  roleAtOrg: string
  team?: TeamDoc | null
  stints: Tenure[]                    // raw rows for multi-spell display
}

export interface Achievement {
  id: string
  title: string; slug: string; year: string
  category?: string | null
  description?: string | null
  type: 'Team' | 'Individual'
  placement?: string | null
  org?: Org | string | null
  team?: TeamDoc | string | null
  game?: GameDoc | string | null
  members?: (Member | string)[] | null
}

export interface Brand {
  id: string
  name: string; slug: string
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
```
(`Member` unchanged and does **not** carry `tenures` inline — the join is admin-only;
the site fetches tenures via a reader. **`Org` is extended** with `banner` +
`website/twitter/instagram/youtube` for the org detail header — see PLAN-G §G2;
additive, grid readers ignore the extra fields.)

---

## E2. New readers  → `src/lib/data.ts` (cast-and-narrow)

| Reader | Query | Depth | Returns |
|---|---|---|---|
| `getOrgBySlug(slug)` | organizations, `where slug` | 1 | `Org \| null` |
| `getOrgRoster(orgId)` | **tenures** `where org`, `sort joinedAt` | **2** | `RosterMember[]` (via E4 transform) |
| `getMemberTenures(memberId)` | tenures `where member`, `sort joinedAt` | 2 | `Tenure[]` |
| `getOrgAchievements(orgId)` | achievements `where org`, `sort -sortKey` | 1 | `Achievement[]` |
| `getMemberAchievements(memberId)` | achievements `where members in [id]` | 1 | `Achievement[]` |
| `getBrands()` | brands, `sort -featured,-sortKey` | 1 | `Brand[]` |
| `getBrandsByOrg(orgId)` | brands `where orgs in [id]` | 1 | `Brand[]` |
| `getMemberBrands(memberId)` | brands `where members in [id]` | 1 | `Brand[]` |

`getAllOrgSlugs()` already exists. `getOrgRoster` and the `*Brands`/`*Achievements`
member readers **omit any `isActive` filter** (alumni must appear).

**`getRosterStats` fix (review F3 — LOCKED):** it currently counts **all** members + sums
**all** followers → the ~40 alumni would skew the homepage stats. Decided:
- **"Players & creators"** count + **"Combined reach"** → filter **`isActive: true`**
  (current roster only): `find({ collection:'members', where:{ isActive:{ equals:true } },
  select:{ socials:true } })` → use `.totalDocs` for count, sum `socials[0].followers` for reach.
- **"Titles"** auto value → **team-honours count**:
  `payload.count({ collection:'achievements', where:{ type:{ equals:'Team' } } })`
  (replaces the `games` mislabel). The manual `StatsBand` override still wins when set.

> ⚠ **The one runtime check (shared):** filtering a **hasMany relationship** uses
> `where: { members: { in: [id] } }` (and `{ orgs: { in: [id] } }`). Payload supports
> `in`/`equals` on hasMany relationships (membership semantics). Verify once at build;
> if `in` misbehaves, `equals: id` is the fallback. This single operator underpins
> `getMemberAchievements`, `getBrandsByOrg`, `getMemberBrands`.

---

## E3. Depth budget & no-N+1 composition

- **Org page** runs **4 reads in `Promise.all`:** `getOrgBySlug`, `getOrgRoster`,
  `getOrgAchievements`, `getBrandsByOrg`. The **roster-card honour counts are built
  in-app** from the single `getOrgAchievements` result (E4 `memberHonourMap`) — **no
  per-member query.**
- `getOrgRoster` `depth: 2` covers tenure→member→avatar and tenure→team→game in one
  query. (`select` projections to trim payload = optional later opt; skipped now for
  parity with existing readers.)

---

## E4. Pure transforms (the justified departure)

Location decision **D-E1**. Proposed `src/lib/roster.ts` (keeps `data.ts` pure
fetchers):

- `toRosterMembers(tenures: Tenure[], orgId): RosterMember[]`
  — group rows by member id; per member derive `joinedAt` (earliest),
  `leftAt` (latest, null if any open), `isCurrent` (any open), `isFounding` (any),
  `roleAtOrg` (current-else-latest), `team`; attach raw `stints`.
- `groupRoster(rm: RosterMember[]): { players, staff }` then each `{ current, alumni }`
  — players vs staff via **`STAFF_ROLES`** (from `labels.ts`, F3 — single source, not a
  hardcoded set); sort `joinedAt` asc.
- `splitHonours(a: Achievement[]): { team, individual }` — by `type`.
- `memberHonourMap(orgAch: Achievement[]): Map<string, Achievement[]>` — invert
  achievements→members for roster-card counts/chips. **Keys are `String(member.id)`**
  (Postgres ids are numeric; the H lookup uses `honourMap.get(String(member.id))`) so
  key/lookup types always match.

All pure (unit-testable, no Payload import). `getOrgRoster` calls `toRosterMembers`
before returning, so pages still get a clean `RosterMember[]`.

---

## E5. Delete-integrity — **full hooks (D-E2 locked)**

Context: Payload has **no cross-collection FK cascade**. The render layer already
tolerates dangling refs (relationship→deleted-doc comes back as a bare id string, and
every path narrows with `typeof v === 'object'`, so nothing crashes) — so this is
**hygiene, not crash-safety**. We're nonetheless doing **full cleanup on all three
collections** (chosen) to prevent **count drift** and dead rows.

**Cleanup matrix** — note required vs optional refs decide *delete row* vs *null/pull*:

| Deleted doc | Action on referencing data |
|---|---|
| **Member** | `delete tenures where member==id` (member is **required** on tenure) · **pull** id from `achievements.members` & `brands.members` (hasMany) |
| **Organization** | `delete tenures where org==id` (org **required**) · `delete teams where org==id` (org **required** → cascades into Teams hook) · **pull** id from `brands.orgs` (hasMany, but `minRows 1` — see guard below) · **null** `achievements.org` (optional single) |
| **Team** | **null** `tenures.team`, `achievements.team`, `brands.team` (all optional singles) |

**Implementation** (`src/hooks/cleanup.ts`, three small `afterDelete` hooks):
- hasMany prune has no atomic operator → `find` referencing docs, remove the id from
  the array in JS, `update` each.
- Each hook wrapped in **try/catch** (like `withRevalidate`) so seed/script deletes
  never throw; uses `req.payload`.
- **`brands.orgs` minRows 1 guard:** if pulling an org would empty a brand's `orgs`,
  either delete the brand or leave it for manual fixup — **delete the now-orphaned
  brand** (a brand with no family org has nothing to attach to). Documented so the
  minRows validation can't deadlock the cascade.
- **No cycles:** Org→Teams→null-refs and Member→tenures are acyclic; safe.

**Seed interaction:** `seed.ts` `reset()`s collections — these hooks will fire on those
deletes. Reset **in dependency order** (tenures / achievements / brands refs → teams →
members → orgs) or simply rely on the cascade; either way idempotent. Note in N (seed).

---

## E6. Deltas to the master plan

- **Step 0.5** readers = the E2 table; transforms in `src/lib/roster.ts` (D-E1);
  types in `src/lib/types.ts` per E1.
- **New Phase-0 step** — `src/hooks/cleanup.ts`: `afterDelete` on Members +
  Organizations + Teams (E5 matrix), wired in each collection config.
- Render-narrowing keeps this **non-blocking** (no crash on dangling refs); the hooks
  exist for DB hygiene + accurate counts.
- Optional later: upgrade the existing `getAchievements()` (global `/achievements`
  timeline) to return `Achievement` (depth 1) so it can show `type`/`placement` —
  a presentation-cluster nicety, not part of E.

---

## E-decisions — LOCKED

- **D-E1** ✅ Pure aggregation helpers in a new `src/lib/roster.ts`; `data.ts` stays
  pure fetchers.
- **D-E2** ✅ **Full** `afterDelete` cleanup hooks on **Members + Organizations +
  Teams** (cleanup matrix in E5), each try/catch-guarded.
