# Deep-dive N — Seed strategy

Status: **DESIGN LOCKED** (final agenda item of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-N1** `createIfAbsent` — non-destructive seed (admin enrichment survives;
cascade-free).
Lands the M dataset into `src/seed.ts` for Tenures + Brands + Achievement links +
~40 Members, safely alongside E5's delete-cascade hooks and M's heavy admin enrichment.

---

## N0. Current seed mechanics (verified)

- Helpers: `upsert(coll, slug, data)` (update-by-slug else create); `reset(coll)`
  (delete **all** then recreate); `uploadOnce` (media by alt).
- **Pattern today:** games + orgs = **upsert**; **members + teams = `reset` (deleted &
  recreated every run)**; achievements/founders/matches = reset; globals = `updateGlobal`.
- So **reseeding currently wipes all admin edits to members/teams** (avatars, socials,
  bios). That was tolerable when members were few and seed-authored.

---

## N1. The crux — reset will destroy M's enrichment (D-N1)

M locked **full profiles for ~40 members**, enriched **progressively in admin** (avatars,
socials, tenures via the join field). With the current **reset-members** behaviour, a
single `npm run seed` re-run **erases every hand-added avatar/social/tenure**. That's a
foot-gun the moment the maker starts entering data.

**Recommended: switch the roster + new collections to `createIfAbsent`** — insert a
record only when its slug/key is missing; **never overwrite an existing one**. Seed
becomes a *baseline filler*, admin edits are sacrosanct. Bonus: with **no deletes**, the
**E5 cascade never fires during seed**, so all the reset-ordering complexity disappears.

New helper:
```ts
async function createIfAbsent(payload, collection, where, data) {
  const { docs } = await payload.find({ collection, where, limit: 1, depth: 0 })
  return docs[0] ?? await payload.create({ collection, data })
}
```
- Members/Brands/Achievements → keyed by `slug`.
- Tenures (no slug) → composite key `{ member, org, joinedAt }`.

(Alternatives in D-N1: keep `reset` = simplest but wipes enrichment; or `upsert` =
reverts admin edits to seed values each run.)

---

## N2. Data structuring (maintainable at ~40 members / ~70 tenures)

Encode M as **arrays/maps keyed by slug**, then loop — not 40 inline blocks:
```ts
const MEMBERS = [ { slug:'mortal', ign:'MortaL', realName:'Naman Mathur',
                    country:'IN', isActive:true, orgSlug:'s8ul' }, … ]
const TENURES: Record<slug, Stint[]> = {            // by member slug
  mortal: [ { orgSlug:'soul', role:'PLAYER', joinedAt:'2018-12-21',
              leftAt:'2023-01-16', isFounding:true },
            { orgSlug:'s8ul', role:'OWNER',  joinedAt:'2022-01-01' } ],
  goblin: [ { orgSlug:'soul', teamSlug:'team-iqoosoul', role:'PLAYER',
              joinedAt:'2022-03-04', leftAt:'2024-01-11' },
            { orgSlug:'soul', teamSlug:'team-iqoosoul', role:'PLAYER',
              joinedAt:'2025-05-01' } ],   // rejoin = 2 rows
  … }
const ACHIEVEMENTS = [ { slug:'bgis-2026', title:'BGIS 2026', year:'2026',
   type:'Team', placement:'Champion', orgSlug:'soul', gameSlug:'bgmi',
   teamSlug:'team-iqoosoul', memberSlugs:['nakul','goblin','legit','jokerr','thunder'] }, … ]
const BRANDS = [ { slug:'iqoo', name:'iQOO', category:'Title', status:'Active',
   orgSlugs:['soul'], teamSlug:'team-iqoosoul' } ]
```

---

## N3. Slug → id resolution & create order

With `createIfAbsent` (no deletes, cascade-free), order is just **dependency order**:
1. games, orgs (upsert as today) → build `orgBySlug`, `gameBySlug`.
2. teams (`createIfAbsent` by slug) → `teamBySlug`.
3. members (`createIfAbsent` by slug, from `MEMBERS`) → `memberBySlug`.
4. **tenures** — for each member's `TENURES`, `createIfAbsent` by `{member,org,joinedAt}`,
   resolving `orgSlug/teamSlug` → ids. (`title` auto-set by the A3 hook.)
5. **achievements** — `createIfAbsent` by slug; resolve `orgSlug/gameSlug/teamSlug/
   memberSlugs` → ids for the link fields.
6. **brands** — `createIfAbsent` by slug; resolve `orgSlugs/teamSlug/memberSlugs`.
7. founders (unchanged), matches (unchanged), globals (K).

`Member.org` for departed players = their **last family org** (e.g. Scout → `soul`),
with `isActive:false`; current/family members keep their live org + `isActive:true`.

---

## N4. Globals (K) in seed

- Navigation: add the **"Partners" → /brands** header + footer entries (createIfAbsent
  on the array, or set if missing) — plus mirror in the `getNavigation` fallback.
- Page Intros: set `brands` + `orgDetail` group defaults (via defaultValue + reader
  fallback, so even unseeded they render).

---

## N5. Founders vs owner-Members (no duplication)

Founders collection stays the leadership/about bios (MortaL, Thug, Goldy, Sumit). The
**same people also exist as Members** with `OWNER` tenures (MortaL→S8UL owner,
Thug→S8UL owner). Both are intentional (Founders = about page; Members = roster/brand
linkage). Seed keeps them in sync by slug; no merge.

---

## N6. Edge cases & safety

1. **Re-run safety:** `createIfAbsent` → idempotent **and** non-destructive; admin
   enrichment survives. (Big change from today's member-reset.)
2. **Cascade-free seed:** no deletes → E5 hooks never fire during seed → no ordering
   traps. (`revalidate` purge is already try/catch seed-safe.)
3. **Partial profiles render:** members seeded without avatar/socials still display (F
   null-safe) — matches M's phased enrichment.
4. **Rejoins** seed as two tenure rows (Goblin, Jokerr) → `formatStints` renders the
   multi-spell range.
5. **8Bit current roster** (new in M) + **8Bit founders** (⚠ unverified) seeded once M's
   ⚠ rows are confirmed; leave 8Bit founders out until confirmed rather than guess.
6. **Existing seeded members** (current rosters already in seed) — switch them to the
   `MEMBERS`/`TENURES` arrays so there's one source, not two code paths.

---

## N7. Deltas & verification

- **Edited:** `src/seed.ts` — add `createIfAbsent`; convert members/teams off `reset`;
  add `MEMBERS/TENURES/ACHIEVEMENTS/BRANDS` data + loops; globals (K).
- **Verify:** `npm run type-check` → `npm run seed` (re-run twice; row counts stable,
  no dupes) → `devsafe` → spot-check an org page (roster current+alumni, rejoin ranges,
  trophy winners) + a multi-org profile (MortaL) + the /brands hub.
- **Note:** CLAUDE.md's "members are RESET each run" line should be updated to
  "createIfAbsent — non-destructive" after this lands.

---

## N-decisions — LOCKED

- **D-N1** ✅ **`createIfAbsent`** — seed inserts missing records only, never overwrites;
  admin enrichment + tenures survive every reseed; no deletes → cascade-free. Replaces
  today's member/team `reset`. (CLAUDE.md's "members are RESET each run" note to be
  updated accordingly.)
