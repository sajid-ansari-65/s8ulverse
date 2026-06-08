# Deep-dive A — Tenure model  (decided: separate `Tenures` collection)

Status: **DESIGN LOCKED** (agenda item A of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Goal: model a member's affiliation history so legacy rosters are correct for
players who moved between family orgs.

Decisions locked: **D-A1** separate `Tenures` collection · **D-A2** keep
`Member.org` as current/primary · **D-A3** distinct "Former member" treatment for
alumni · **D-A4** optional `team` (squad/game) per tenure.

---

## A1. The problem (proven against the seed)

`src/seed.ts` seeds **MortaL** as `role: CREATOR, org: s8ul` — though he **founded
Team SouL**. Affiliation lived as a single `org` per Member, so a SouL roster built
as `members where org == soul` would **omit MortaL** (and everyone who moved
SouL→S8UL, 8Bit→S8UL, rejoined, or was loaned). Founding is **per-org**, and members
can have **multiple stints** — none of which a flat field on Member can hold.

→ Affiliation is a **history**; it needs its own records.

---

## A2. Why a separate collection (vs the stint-array alternative)

A `stints[]` array on Member was the other candidate. The collection wins here:

- **Trivial, reliable queries both ways** — `tenures where org == X` for a roster,
  `tenures where member == Y` for a profile timeline. **No dependence on Payload
  querying a relationship nested inside an array** (the one risky assumption of the
  array approach — now eliminated).
- **First-class stint records** — each can carry its own metadata later (tenure-
  scoped notes, etc.) without reshaping Member.
- **Admin friction is solved by a `join` field** (A4) — editors still manage a
  person's tenures *from the Member page*, even though they're stored separately.

Cost accepted: one more collection + a delete-cleanup hook (A9).

---

## A3. The `Tenures` collection  → `src/collections/Tenures.ts`

`slug: 'tenures'`, `admin.group: 'Content'`,
`admin.defaultColumns: ['title','member','org','role','joinedAt','leftAt']`.

| Field | Type | Req | Notes |
|---|---|---|---|
| `member` | relationship → members | ✅ | the person |
| `org` | relationship → organizations | ✅ | which family org |
| `team` | relationship → teams | — | squad/game in that org. `filterOptions` → teams whose `org` == `siblingData.org` (clean here: filterOptions gets siblingData). |
| `role` | select | ✅ | role **during** this stint: Player / Creator / Coach / Analyst / **Manager** / Owner |
| `joinedAt` | date (month+year picker) | ✅ | **entry** |
| `leftAt` | date (month+year picker) | — | **exit**; blank = current |
| `isFounding` | checkbox | — | founded *this org* |
| `note` | text | — | fuzzy-date / context |
| `title` | text (hidden, auto) | — | `beforeChange` hook sets e.g. "MortaL · Team SouL · 2018–present" so the admin list & relationship pickers are readable. `admin.useAsTitle: 'title'`. |

`access.read: () => true` (public, like the others).

---

## A4. Admin ergonomics — the `join` field (Payload v3)

So the maker never has to leave the Member screen:

- **On `Members`:** add `{ name: 'tenures', type: 'join', collection: 'tenures',
  on: 'member' }` — renders that member's tenures inline, create/edit in place.
  Put it in a **new "Affiliations" tab** (review F6 — decided: its own tab; this tab also
  hosts the now-legacy `member.teams` field so the admin shape stays tidy).
- **On `Organizations` (optional, nice):** `{ name: 'roster', type: 'join',
  collection: 'tenures', on: 'org' }` — see an org's full roster from its admin page.

The `join` field is virtual (no column); it just surfaces the related Tenure rows.

---

## A5. How existing Member fields are redefined (no breakage)

- **`Member.org`** → **current / primary org** (profile badge + `/players`
  grouping). Kept explicit (D-A2) so existing readers/JSON-LD reading `m.org` don't
  change. Rule: should equal the member's open tenure's org. (Optional future
  `afterChange`/`afterChange` sync hook — deferred.)
- **`Member.joinedAt`** → stays "**joined the S8UL family**" (family-level), distinct
  from per-org `Tenure.joinedAt`. Clarify both `admin.description`s.
- **`Member.role`** → current/primary role; `Tenure.role` = role at the time.
- **`Member.teams`** → current squads (quick display); `Tenure.team` = historical
  squad. Both kept; documented.
- **No `isFoundingMember` / `leftAt` on Member** — they live on Tenure now. This
  **supersedes master-plan Step 0.2's flat fields.**

---

## A6. Migration impact

- New collection → new tables `tenures` (+ relationship rows for member/org/team)
  and its enum for `role`. **Purely additive** → safe dev `push`; `devsafe` restart.
- `Tenure.role` is a **fresh enum incl. `Manager`** → **no `ALTER TYPE ADD VALUE`**.
  The top-level `Member.role` enum is left untouched unless we separately decide to
  add Manager there (Deep-dive B — likely now unnecessary).

---

## A7. Readers (`src/lib/data.ts`)

```
getOrgRoster(orgId): Promise<RosterMember[]>
  payload.find({ collection: 'tenures',
    where: { org: { equals: orgId } },
    depth: 2,            // populate member (+avatar), team, org
    limit: 1000, sort: 'joinedAt' })
  → group by member id (a member with 2 stints at the org → merge):
      joinedAt   = earliest tenure.joinedAt
      leftAt     = latest tenure.leftAt (null if any open)
      isCurrent  = some tenure has no leftAt
      isFounding = some tenure.isFounding
      roleAtOrg  = current-else-latest tenure.role
      team       = current-else-latest tenure.team
      stints     = the raw rows (for "2019–20, 2022–present" display)
  → one RosterMember per member.

getMemberTenures(memberId): Promise<Tenure[]>   // profile-page timeline, all orgs
```

No `isActive` filter on `getOrgRoster` (alumni must appear). Achievements-per-member
are joined in **Deep-dive C**.

---

## A8. View types (`src/lib/types.ts`)

```ts
export interface Tenure {
  member: Member | string
  org: Org | string
  team?: TeamDoc | string | null
  role: string
  joinedAt: string            // ISO; render month+year
  leftAt?: string | null
  isFounding?: boolean | null
  note?: string | null
}
export interface RosterMember {
  member: Member              // ign, slug, avatar, country, current role, isActive
  joinedAt: string
  leftAt?: string | null
  isCurrent: boolean
  isFounding: boolean
  roleAtOrg: string
  team?: TeamDoc | null
  stints: Tenure[]            // raw, for multi-spell display
}
```
Mapper `asRosterMember(tenureRows[], orgId)`.

---

## A9. Edge cases, integrity & rules

1. **Delete cleanup:** deleting a Member must not orphan its Tenures. Add an
   `afterDelete` hook on **Members** → `payload.delete({ collection:'tenures',
   where:{ member:{ equals:id } } })`. (Payload has no DB cascade by default.)
   Likewise consider org deletion — but orgs are near-static; note only.
2. **Alumni:** `getOrgRoster` includes inactive members. Confirmed
   `getAllMemberSlugs` has no isActive filter (alumni get profile pages) and
   `getAllMembers` filters isActive (alumni off the main grid). **Former-member**
   treatment (D-A3) = a muted badge on the profile + roster card when `!isActive`
   (or when the member has no open tenure anywhere).
3. **Multi-org members** appear on multiple org legacy pages — correct (MortaL on
   SouL as founder/alumni AND S8UL as current).
4. **Rejoins** = multiple tenure rows same member+org; reader merges; component may
   render "2019–2020 · 2022–present".
5. **`team` mismatched to `org`:** prevented by `filterOptions` using `siblingData.org`;
   fallback validate hook.
6. **Revalidation:** wrap `Tenures` in `withRevalidate` (a tenure edit changes org
   rosters + the member page).
7. **Seed (`src/seed.ts`):** after members, `reset(payload,'tenures')` then create
   tenure docs (same pattern as `teams`). Minimum one current tenure per member
   mirroring `org`; real multi-stint history (MortaL etc.) comes from **Deep-dive M
   (sourcing)**. Idempotent.

---

## A10. Net deltas to the master plan

- **Step 0.2** (Members flat `leftAt/isFoundingMember`) → **replaced**: Members gets
  only the `tenures` **join** field; tenure data moves to the new collection.
- **New Step 0.x — `Tenures` collection** (+ `Organizations.roster` join, optional).
- **Step 0.5 readers** += `getOrgRoster`, `getMemberTenures`.
- **Deep-dive B (MANAGER enum)** likely **void** — Manager lives on the fresh
  `Tenure.role` enum, not the existing Member enum.
- **Phase 1 LegacyRoster** consumes `RosterMember[]`; profile page gains a tenure
  timeline (own-history) distinct from the existing `career[]` milestones.

> Open question for later (not blocking A): `career[]` (free-text milestones) vs
> `tenures` (structured stints) now overlap. Keep both (career = narrative colour,
> tenures = factual roster), or eventually derive one from the other? → resolved in
> **Deep-dive J** (member profile page additions), which owns all player-page edits.
