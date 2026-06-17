# Deep-dive I — OrgHonours + Brands UI

Status: **DESIGN LOCKED** (agenda item I of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-I1** trophy-cabinet grid · **D-I2** winner avatars on each honour.
Two components the org page (G) and the /brands hub (D) mount: **OrgHonours** (team-
trophy display, C rule) and **BrandGrid** / **BrandsClient** (shared brand cards +
hub filter). Consumes C (honours), D (brands), E (readers), F (labels/formatters/mappers).

---

## I0. Reuse vs new (verified)

- Existing **`Timeline`** (`/achievements`) is a vertical gradient-spine list, but its
  local `Achievement` type is the **old shape** (year/title/description/category) — no
  `placement`/`type`/`game`/`members`. Upgrading it would touch the live global page →
  **keep `Timeline` as-is** for `/achievements`; build a **richer `OrgHonours`** for org
  pages. (Optional later: unify; out of scope for I.)
- **`OrgsGrid`** is the card idiom `BrandGrid` mirrors (TiltCard + Reveal + accent,
  featured card spans wide).
- No filter component exists → `BrandsClient` is net-new (confirmed in D).

---

## I1. `OrgHonours`  → `src/components/site/OrgHonours.tsx`

Input: `teamHonours: Achievement[]` (from `splitHonours(getOrgAchievements).team` — G
already derives it) + `accent`. **Team honours only** (C-D1); individual honours live
on player surfaces (J).

- Section `id="honours"` (G sub-nav target); returns `null` when empty (G omits it too).
- **Layout (D-I1 locked): trophy-cabinet grid** — a responsive grid of trophy cards
  (TiltCard/Reveal, OrgsGrid idiom, denser), a celebratory "silverware wall".
- Each trophy **card** shows: **placement badge** (`PLACEMENT_LABELS`, e.g. 🏆 Champion /
  🥈 Runner-up) as the lead, **title** + **year**, **game chip** (`asGame(game)?.name`),
  optional **`category`** pill, and **winner avatars** (D-I2 locked) —
  `resolveMany(members)` → small avatars linking to `/players/{slug}`, capped (4 + "+X").
  `members` are already populated by `getOrgAchievements` depth 1 → **no extra query**.
- Sorted by `-sortKey` (reader already does). Optional: most-prestigious / latest card
  spans wide like the OrgsGrid lead (nice-to-have, not required).

---

## I2. Shared honour/placement badge (H5 follow-through)

The placement/trophy badge appears in **3 places** — OrgHonours (placement badge),
H roster card (🏆 count + individual chips), J player page (full split). Define it
**once**: a small `PlacementPill` (maps `placement` → icon+label via `PLACEMENT_LABELS`)
+ a `TrophyCount` snippet, in `ui.tsx` or a `honours.tsx` component file. Avoids three
divergent badge styles.

---

## I3. `BrandGrid`  → `src/components/site/BrandGrid.tsx` (server)

Shared by the hub **and** the per-org section. Input: `brands: Brand[]` + optional
`accentFallback`. Card (TiltCard/Reveal, `OrgsGrid` idiom):
- **logo** (or `Initial` from name), **name**
- **category badge** (`BRAND_CATEGORY_LABELS`)
- **status**: `Past` → muted card + "Past" pill; `Active` → normal
- **naming-rights**: if `category === 'Title'` and `team` → line "Title sponsor of
  {asTeam(team)?.name}" (e.g. Team iQOOSouL)
- **org chips** (`resolveMany(orgs)` → shortName), **member avatars**
  (`resolveMany(members)`, capped +X), **scope chip** (`asTeam(team)?.name` /
  `asGame(game)?.name`), **date window** (`formatBrandWindow`), external `url` link
- **accent** = first linked org's `accentHex` ?? `accentFallback` ?? neutral
- `featured` → wide card (like OrgsGrid's lead)
- empty → OrgsGrid-style message.

---

## I4. `BrandsClient`  → `src/components/site/BrandsClient.tsx` (client)

Hub-only wrapper (the per-org section uses bare `BrandGrid`). `'use client'`.
- Props: `brands: Brand[]`, `orgs: {slug,name,shortName}[]` (filter chips).
- State: `org` (all / one) + `status` (Active default / Past / all). Client-side filter
  (small dataset). Renders `BrandGrid` with the filtered list + empty state per filter.
- Mirrors the site's chip/Pill styling; no URL state needed (could add `?org=` later).

---

## I5. Where each mounts (wiring owned elsewhere)

- **OrgHonours** → G org page §7 (`teamHonours`).
- **BrandGrid** (per-org) → G org page §8 (`getBrandsByOrg`), no filter. = asks 2–3.
- **BrandsClient** → the `/brands` hub page (D5 / Phase 2) — `getBrands()` + org list.
- I delivers the **components**; page files + section mounting live in G and the hub
  page step.

---

## I6. Edge cases

1. **Honour with no members** (org milestone, e.g. Content Group) → no avatars, just
   year/title/placement/category. ✓
2. **Honour with no placement** (award) → omit placement badge; `type=Team` still
   qualifies it for OrgHonours. (Content Group is Team-type, no placement → shows as a
   titled entry.)
3. **Brand with no members** → card shows orgs only, no avatar row.
4. **Past brand** → muted; hidden under the Active default filter on the hub, always
   shown in the per-org section (history matters there) — or honour the same Active
   default? **Decision:** per-org section shows **all** (Active + Past) since an org's
   brand *history* is the point; hub defaults to Active. Noted.
5. **Avatar overflow** (5-player roster) → show 4 + "+1".

---

## I7. Deltas

- New: `OrgHonours.tsx`, `BrandGrid.tsx`, `BrandsClient.tsx`, shared honour badge
  (`honours.tsx` or `ui.tsx` additions).
- No new readers/types (all from C/D/E/F).
- `Timeline` (global `/achievements`) untouched.

---

## I-decisions — LOCKED

- **D-I1** ✅ OrgHonours = **trophy-cabinet grid** (cards, silverware wall), distinct
  from the global `/achievements` timeline.
- **D-I2** ✅ Each trophy card shows **winner avatars** (capped 4 + "+X"), linking to
  profiles.
