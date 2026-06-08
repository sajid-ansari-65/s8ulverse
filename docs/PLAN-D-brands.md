# Deep-dive D — Brands / partnerships

Status: **DESIGN LOCKED** (agenda item D of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Delivers asks 1–3: brand-engagement hub + S8UL + 8Bit-Creative brand management.
Locked: **D-D1** Title category + `team` link · **D-D2** one record per brand ·
**D-D3** month+year dates, `orgs` required ≥1.

---

## D0. Context (verified)

- **No Brands collection exists.**
- House conventions to match: `slug` is **manual** (`required, unique, index`) — no
  auto-slug hook anywhere; collections are wrapped `withRevalidate(X)` in
  `payload.config.ts`; nav is **data-driven** (Navigation global), so a `/brands` link
  is an admin/seed row, not hardcoded.
- **Naming-rights is already partly in the data:** the SouL BGMI squad's
  `Team.name` = **"Team iQOOSouL"** (sponsor baked into the squad name). So the Brands
  record for iQOO is the *relationship*; the squad name is the *visible result*.

---

## D1. The `Brands` collection  → `src/collections/Brands.ts`

`slug: 'brands'`, `admin.group: 'Content'`,
`admin.useAsTitle: 'name'`, `defaultColumns: ['name','category','status','featured']`,
`access.read: () => true`.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | text | ✅ | brand company — "iQOO", "AMD", "Monster Energy" |
| `slug` | text (unique, index) | ✅ | manual (house style); optional slugify hook noted in D7 |
| `logo` | upload → media | — | brand mark |
| `category` | select | ✅ | **Title / Naming Rights** · Sponsor · Ambassador · Collaboration · Merch · Campaign · Event (D-D1) |
| `orgs` | relationship → organizations (hasMany, **minRows 1**) | ✅ | which family orgs (D-D3) |
| `members` | relationship → members (hasMany) | — | who does the brand work (players/creators/owners) |
| `team` | relationship → teams | — | **G3 / naming-rights:** scope a deal to a squad (jersey sponsor for Valorant) **and** the squad a Title brand names (iQOO → Team iQOOSouL). `filterOptions` → teams of a selected org. |
| `game` | relationship → games | — | **G3:** scope to a discipline when there's no single team |
| `status` | select | ✅ | Active / Past (default Active) — drives filter + muted styling |
| `startDate` / `endDate` | date (month+year picker) | — | deal window; `endDate` blank = ongoing (D-D2) |
| `description` | textarea | — | the partnership in a line or two |
| `url` | text | — | brand / campaign link |
| `featured` | checkbox | — | hub highlight (wide card) |
| `sortKey` | number (index) | — | manual ordering |

---

## D2. Naming-rights & the iQOOSouL thread (D-D1)

- A **Title / Naming Rights** brand (iQOO) links `team = Team iQOOSouL`, `category =
  Title`. Renders as "**Title sponsor of Team iQOOSouL**" on the brand card, the org
  brand section, and (optionally) a small tag on the team's roster chip.
- **`Team.name` stays the current competitive name** ("Team iQOOSouL") — the real
  name; Brands captures the *who/why*. We do **not** auto-rename teams from brands.
- **Out of scope (flagged):** *historical* team-naming (a squad's sponsor name across
  eras) would need a team-name-history model. Deferred — not needed for v1; a Past
  Title brand with `endDate` records the fact without renaming history.

---

## D3. Readers (`src/lib/data.ts`)

- `getBrands()` → all, `sort: ['-featured','-sortKey']`, `depth: 1` (logo, orgs,
  members, team, game). Hub.
- `getBrandsByOrg(orgId)` → `where: { orgs: { in: [orgId] } }`, same depth. Per-org
  section ("S8UL / 8Bit Creative brand management").
- `getMemberBrands(memberId)` → `where: { members: { in: [memberId] } }`. The member
  "Brand work" tab (reverse query).
- ⚠ Same hasMany operator check as C (`in` expected for relationship hasMany; verify
  once). Shared with the Tenures/Achievements queries.

---

## D4. View types (`src/lib/types.ts`)

```ts
export interface Brand {
  name: string
  slug: string
  logo?: MediaDoc | string | null
  category: string
  status: 'Active' | 'Past'
  orgs: (Org | string)[]
  members?: (Member | string)[] | null
  team?: TeamDoc | string | null
  game?: { name: string; slug: string } | string | null
  startDate?: string | null
  endDate?: string | null
  description?: string | null
  url?: string | null
  featured?: boolean | null
}
```
Mapper `asBrand`.

---

## D5. UI

- **`/brands` hub** → `src/app/(frontend)/brands/page.tsx` (`revalidate = 3600`,
  `generateMetadata`). `PageHero` + `BrandsClient`.
- **`BrandGrid`** → `src/components/site/BrandGrid.tsx` (server) — cards in the
  OrgsGrid idiom (TiltCard + Reveal; accent from the first linked org's `accentHex`;
  `featured` spans wide). Card: logo, name, **category badge**, org chips, involved
  **member avatars**, team/game scope chip, status, date window.
- **`BrandsClient`** → new **client** filter component (none exists to reuse): filter
  by **org** (chips) + **Active/Past** toggle; renders `BrandGrid`. Empty state like
  OrgsGrid's.
- **Per-org brand section** — on `/orgs/[slug]`, a "Brand partnerships" block from
  `getBrandsByOrg(orgId)` via a compact `BrandGrid`. This *is* asks 2 & 3.
- **Member "Brand work" tab** — add to the existing `ProfileTabs` on the player page;
  server-fetched `getMemberBrands(memberId)` passed in; lists brand logo + category +
  date window. Hidden when empty.

---

## D6. Navigation & copy

- Add a `/brands` entry to the **Navigation** global (seed + admin-editable), and a
  footer link. No hardcoding.
- Hub intro copy via **Page Intros** global (add a `brands` group), consistent with
  other index pages — keeps it admin-editable ([[feedback-fully-editable-from-admin]]).

---

## D7. Migration, seed, integrity

- **Migration:** new collection → tables + enums (`category`, `status`). **Additive**
  → safe `push`; `devsafe` restart.
- **Config:** add `withRevalidate(Brands)` (and `withRevalidate(Tenures)` from A) to
  `payload.config.ts`.
- **Seed:** add the known iQOO Title-sponsor record (orgs=[soul], team=Team iQOOSouL,
  category=Title, status=Active) to validate end-to-end; real sponsor roster =
  **Deep-dive M (sourcing)**. Idempotent upsert by slug.
- **Optional slugify hook:** a `beforeValidate` that derives `slug` from `name` if
  blank — small ergonomic win; house style is currently manual, so this is opt-in.
- **Delete integrity:** deleting a member/org/team must not leave stale ids in
  Brands' hasMany relationships. **Same shared concern as A9.1 + C7.6** → consolidate
  into one relationship-cleanup task (Members/Orgs/Teams `afterDelete` prune
  Tenures + Achievements.members + Brands.members/orgs/team). Tracked as a cross-cutting
  item, not solved three times.

---

## D8. Edge cases & rules

1. **Brand, no members** (org-level sponsor) → hub + org section, no member
   attribution. ✓
2. **`orgs` required (≥1)** (D-D3) — a family brand deal always involves an org; a
   `team`/`game` scope refines *within* that.
3. **Multi-org brand** (sponsors both S8UL & SouL) → `orgs` hasMany; appears on both
   org sections. ✓
4. **Past deals** → `status = Past`, muted card, filtered out of "Active" by default;
   `endDate` shown.
5. **`team`/`game` ↔ `org` mismatch** → `filterOptions` by selected org; fallback
   validate hook.
6. **Returning sponsor** (iQOO leaves, returns) → see D-D2: either update the single
   record's status/dates, or a second record. (Brands rarely repeat — unlike player
   stints — so a single record is usually enough.)

---

## D9. Deltas to the master plan

- **Step 0.1** Brands gets the finalized field list above (adds `team`, Title category,
  `minRows 1` on orgs, month+year dates).
- **Step 0.4** config += `withRevalidate(Brands)` (and `Tenures`).
- **Step 0.5** readers += `getBrands`, `getBrandsByOrg`, `getMemberBrands`.
- **Phase 2** UI = `BrandGrid` + `BrandsClient` + per-org section + member tab + nav +
  Page-Intros `brands` group.
- Cross-cutting **relationship-cleanup** task now spans Tenures + Achievements + Brands
  (one hook set) — promote to its own small deep-dive when we reach integrity.

---

## D-decisions — LOCKED

- **D-D1** ✅ **Title / Naming Rights** category + `team` link ("Title sponsor of Team
  iQOOSouL"); team name unchanged.
- **D-D2** ✅ **One record per brand** (status + date window; a return = edit / second
  record). No per-period array.
- **D-D3** ✅ Deal dates at **month+year**; `orgs` **required (≥1)**.
