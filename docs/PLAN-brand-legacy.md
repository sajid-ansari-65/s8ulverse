# Plan — Brand Engagement + Legacy Rosters

Status: **A–N all locked. Review in progress (flaw-hunt → 100% before coding).**
Review pass 1 (vs CLAUDE.md) DONE: fixed 2 flaws — (F1) `member.teams` display-orphaned
after J's Tenure tab → admin-only, current squads derive from open tenures; (F2) reserve
`brands` slug in Pages validation. **CLAUDE.md updated** to document Tenures/Brands,
Scout-as-alumnus, createIfAbsent seed, /orgs/[slug]+/brands, Partners nav, cleanup hooks.
No build until review signs off.
Scope: S8UL / Team SouL / 8Bit / 8Bit Creative

Decisions locked: achievements are linked (`Achievements ↔ Members`); 8Bit Creative
is its **own** Organizations record; brand work = one `/brands` hub + per-org
sections.

### Deep-dive docs (detailed designs per agenda item)
- **A** — [PLAN-A-tenure-model.md](./PLAN-A-tenure-model.md) — ✅ locked (separate `Tenures` collection)
- **B** — [PLAN-B-role-enum.md](./PLAN-B-role-enum.md) — ✅ void (Manager on fresh `Tenure.role` enum)
- **C** — [PLAN-C-achievements.md](./PLAN-C-achievements.md) — ✅ locked (links + display rule)
- **D** — [PLAN-D-brands.md](./PLAN-D-brands.md) — ✅ locked (Brands collection + hub + per-org + member tab)
- **E** — [PLAN-E-readers-types.md](./PLAN-E-readers-types.md) — ✅ locked (readers, view types, full delete-cleanup hooks)
- **F** — [PLAN-F-presentation-helpers.md](./PLAN-F-presentation-helpers.md) — ✅ locked (mappers · formatters · display-only labels)
- **G** — [PLAN-G-org-detail-page.md](./PLAN-G-org-detail-page.md) — ✅ locked (`/orgs/[slug]` shell · header · JSON-LD · SSG · org OG)
- **H** — [PLAN-H-legacy-roster.md](./PLAN-H-legacy-roster.md) — ✅ locked (LegacyRoster: hero current + compact alumni/staff cards)
- **I** — [PLAN-I-honours-brands-ui.md](./PLAN-I-honours-brands-ui.md) — ✅ locked (OrgHonours trophy-cabinet · BrandGrid · BrandsClient)
- **J** — [PLAN-J-member-profile.md](./PLAN-J-member-profile.md) — ✅ locked (player page:
  brand tab + Tenure tab + featured honours + Former badge + role labels)
- **K** — [PLAN-K-nav-globals-copy.md](./PLAN-K-nav-globals-copy.md) — ✅ locked ("Partners" nav · `brands`+`orgDetail` intros · editable-copy audit)
- **L** — [PLAN-L-sitemap-revalidation.md](./PLAN-L-sitemap-revalidation.md) — ✅ locked (sitemap `/orgs/[slug]`+`/brands` · wrap Tenures/Brands · E5-hook composition)
- **M** — [PLAN-M-data-sourcing.md](./PLAN-M-data-sourcing.md) — ✅ locked (all alumni, full profiles, phased; Liquipedia dataset compiled)
- **N** — [PLAN-N-seed-strategy.md](./PLAN-N-seed-strategy.md) — ✅ locked (createIfAbsent non-destructive seed · M dataset · cascade-free)

- **O** — [PLAN-O-query-optimization.md](./PLAN-O-query-optimization.md) — ✅ locked (indexing · select · **targeted revalidation** · **RLS deny-by-default**)
- **P** — [PLAN-P-security.md](./PLAN-P-security.md) — ✅ locked (SQLi/parameterized · access control · **JsonLd XSS fix** · headers + report-only CSP · API hardening)
- **Q** — [PLAN-Q-rbac.md](./PLAN-Q-rbac.md) — ✅ locked (4-tier **RBAC** owner/admin/editor/contributor; per-collection gating; escalation guard)
- **R** — [PLAN-R-accessibility-responsive.md](./PLAN-R-accessibility-responsive.md) — ✅ locked (a11y + responsive; fixes ProfileTabs focus/ARIA + reduced-motion baseline)

> Review passes 1–6 → **F1–F13 + a11y** fixed. 8Bit owner confirmed = **Beg4Mercy**.
> Only open item left = **build-time verifies** (Payload `join`/`filterOptions`/hasMany) —
> resolved while coding, not paper-closeable.

**✅ Planning A–P locked. Review surfaced 3 fixes (F1, F2, JsonLd XSS) + O/P added. Build-ready after final sign-off.**

### Review pass 3 — gap analysis (comparing the feature vs the existing site)
- **🔴 F3 — Homepage auto-stats skew (verified in `getRosterStats`)** ✅ FIXED: stat reads
  now filter **`isActive`** for "Players & creators" + "Combined reach" (current roster only),
  and the **"Titles"** auto value becomes the **team-honours count** (was the games mislabel);
  manual StatsBand override still wins. (Spec in E §E2.)
- **F4 — Org page has no leadership/owners surface:** owners (role OWNER) are excluded
  from the roster (H), and the org header only shows founded year → an org's founders/
  owners appear nowhere on its page. **Fix (G):** a small "Founded by / Leadership" line
  in the org header from founder-Members (OWNER tenures) or Founders.
- **F5 — `generate:types`:** adding Tenures/Brands collections requires
  `npm run generate:types` → add to the Phase-0 checklist.
- **F6 — Members admin tab for the `tenures` join:** A4 left it "Affiliations tab or
  Career" → **decide: new "Affiliations" tab** (also hosts `member.teams` legacy field).
- **F7 — YouTube build quota:** 40+ alumni player pages each call `getYouTube` at build/
  revalidate → note in O (key-gated, quota-cheap, but watch the 40× at build).
- **F8 — Global `/achievements` page** unchanged → won't show new type/placement/winners
  (org pages do). Optional later alignment; logged, non-blocking.

### Review pass 4 — targeted-revalidation matrix vs page data-deps (O4)
Mapped every page's reads against the O4 matrix → found **2 missed stale-page surfaces**,
both fixed in O4: **(F9)** a Member edit only revalidated `member.org`, but an **alumnus
appears on every org legacy page they had a tenure on** (+ `/brands` if a brand member) →
Member resolver now **fans out to all tenure-orgs + /brands**. **(F10)** Org/Team **names
render on member pages, grids and brand cards**, so their incomplete targeted maps →
**moved Orgs/Teams/Games/Founders/Matches/Pages to broad purge** (near-static, rare edits).
Net rule: **target only Members/Tenures/Achievements/Brands; broad-purge the rest.**
- **F11 (found while answering "is checking done")** — pass-4's F9 fan-out collides with
  E5: on a **Member delete**, cleanup removes the tenures *before* revalidate runs, so the
  fan-out finds no tenure-orgs → stale org pages. **Fix:** Member **`afterDelete` = broad
  purge** (afterChange stays targeted); other deletes use the deleted doc's own ids.

### Review pass 5 — I–P consistency + access-control + RBAC
- **F12 — L contradicts O4:** L still specced the broad-purge revalidation that O4
  replaced with targeted → **L now defers to O §O4** (L owns sitemap only). Fixed.
- **F13 (access-control pressure-test = security hole):** the `Users.role` field is
  **unused** — every collection relies on Payload's default → **any logged-in user edits
  everything**, and **can self-escalate to owner** (no field-access on `role`). →
  **Deep-dive Q (RBAC)** implements per-collection role gating + the escalation guard +
  a `contributor` tier (delegated M data-entry). Closes P2's abstract "verify access".

> **Audit (A–H, this pass):** reconciled 6 cross-refs — G/H `groupRoster` double-call
> (G owns it, passes groups to H); E4 staff-split now uses F's `STAFF_ROLES`; `honourMap`
> keys normalised to `String(id)`; E "no Org change" corrected (G2 extends `Org`); master
> gained **Step 0.6** (labels/roster/format/types/cleanup hooks) + refreshed data-entry &
> files-touched; **J widened** to own all player-page edits (was smeared across A/C).

---

## How the 5 asks map to the build

| Your item | Delivered by |
|---|---|
| 1. Brand-engagement place (who works with which brand) | Phase 0a (Brands collection) + Phase 2a (/brands hub) |
| 2. S8UL brand management | Phase 2b (per-org brand section, filtered to S8UL) |
| 3. 8Bit Creative brand management | Phase 2b (per-org brand section, filtered to 8Bit Creative) |
| 4. SouL legacy players (start→now + achievements) | Phase 1 (org detail page + LegacyRoster, for SouL) |
| 5. 8Bit legacy players | Phase 1 (same component, for 8Bit) |

Execution order: **Phase 0 → 1 → 2 → 3** (schema foundation first, then the two
themes, then polish). Each numbered step below is an approval checkpoint.

---

## PHASE 0 — Data model foundation

> All changes are **additive** (new tables / nullable columns) → dev `push` over
> `DIRECT_URL` (5432) applies them cleanly, no drizzle drop-prompt. After Phase 0,
> restart with `npm run devsafe`.

### Step 0.0 — ~~Verify / create the "8Bit Creative" org~~ ✅ DONE
Verified in `src/seed.ts`: **all four are `organizations` records** — `s8ul`,
`soul` (name "Team SouL"), `8bit`, `8bit-creative`. Nothing to create.

### Step 0.1 — New collection `Brands`  → see [PLAN-D-brands.md](./PLAN-D-brands.md)
Admin group: **Content**. `useAsTitle: name`. (Full spec in PLAN-D.)

| Field | Type | Notes |
|---|---|---|
| `name` | text (required) | e.g. "iQOO", "Monster Energy" |
| `slug` | text (required, unique) | manual (house style) |
| `logo` | upload → media | |
| `category` | select | **Title / Naming Rights** (D-D1) / Sponsor / Ambassador / Collaboration / Merch / Campaign / Event |
| `orgs` | relationship → organizations (hasMany, **minRows 1**) | which family orgs |
| `members` | relationship → members (hasMany) | who does the brand work |
| `team` | relationship → teams (optional) | **G3 + naming-rights:** scope a deal to a squad **and** the squad a Title brand names (iQOO → Team iQOOSouL); filtered to org |
| `game` | relationship → games (optional) | **G3:** scope to a discipline when no single team |
| `status` | select | Active / Past (default Active) |
| `startDate` / `endDate` | date (endDate optional) | |
| `description` | textarea | |
| `url` | text | brand / campaign link |
| `featured` | checkbox | hub highlight |
| `sortKey` | number | manual ordering |

### Step 0.2 — Tenure model: new `Tenures` collection  → see [PLAN-A-tenure-model.md](./PLAN-A-tenure-model.md)
**Superseded the earlier "flat fields on Member" idea.** Affiliation is a *history*
(MortaL founded SouL but now sits under S8UL), and founding is *per-org*, so a flat
`leftAt/isFoundingMember` on Member can't work. Decided model (D-A1):

- **New collection `Tenures`** — one row per member-stint at an org:
  `member`, `org`, `team?` (squad/game, filtered to the org), `role` (Player…/Manager,
  during this stint), `joinedAt` (entry, month+year), `leftAt?` (exit; blank =
  current), `isFounding`, `note`, auto `title`.
- **`Members`** gains only a `tenures` **join** field (Payload v3) → tenures are
  edited *inline on the Member page* but stored separately. (Optional `roster` join on
  Organizations.)
- **`Member.org`** stays = current/primary org (D-A2). **`Member.joinedAt`** stays =
  joined-the-family. Both kept to avoid refactoring readers/JSON-LD.
- Dates at month+year precision; only `joinedAt` required, so partial history is
  enterable. Alumni get a "Former member" treatment (D-A3).

Full field spec, readers (`getOrgRoster`/`getMemberTenures`), delete-cleanup hook,
seed + revalidation in **PLAN-A**. Migration is additive (new tables); the fresh
`Tenure.role` enum includes Manager, so **no `ALTER TYPE` and Deep-dive B is likely
void.**

### Step 0.3 — Extend `Achievements`  → see [PLAN-C-achievements.md](./PLAN-C-achievements.md)
Make trophies linkable (all optional → existing rows stay valid):
- `org` → organizations · `members` → members (hasMany) · `team` → teams (**D-C2**,
  filtered to org) · `game` → games
- `type` — select **Team / Individual** (G2), default Team — drives the display rule
- `placement` — Champion / Runner-up / Top 3 / Qualified (null for awards)
- `category` (existing freeform text) **kept** (D-C3); `year/title/slug/description/
  sortKey` unchanged
- **Display rule (D-C1):** OrgHonours shows **Team** honours once; roster cards show a
  trophy **count** + **Individual** chips; player page shows the full Team/Individual
  split. Member-at-org honours built from one `getOrgAchievements` query (no N+1).

### Step 0.4 — Register + revalidate  → `src/payload.config.ts`
Add `withRevalidate(Brands)` **and `withRevalidate(Tenures)`** (a tenure edit changes
org rosters + the member page).

### Step 0.5 — Readers  → `src/lib/data.ts`
- `getOrgBySlug(slug)`, reuse `getAllOrgSlugs()`
- `getOrgRoster(orgId)` → query **`tenures` where org**, group by member, derive
  entry/exit/current/founding/roleAtOrg/team (no `isActive` filter → alumni included).
  Returns `RosterMember[]`. (See PLAN-A §A7.)
- `getMemberTenures(memberId)` → profile-page own-history timeline.
- `getMemberAchievements(memberId)`, `getOrgAchievements(orgId)` (Deep-dive C)
- `getBrands()`, `getBrandsByOrg(orgId)`, `getMemberBrands(memberId)`
- hasMany relationship filters use `{ field: { in: [id] } }` — verify once (E §E2).

### Step 0.6 — Helpers, types & hooks  → (PLAN-E §E1/E4/E5, PLAN-F, PLAN-G §G2)
- **`src/lib/types.ts`** — add `Tenure`, `RosterMember`, `Achievement`, `Brand`,
  `GameDoc`; **extend `Org`** with `banner` + `website/twitter/instagram/youtube`
  (G2); single-ref guards `asTeam/asGame/asMember` + `resolveMany` (F1).
- **`src/lib/format.ts`** — `formatMonthYear`, `formatTenureRange`, `formatStints`,
  `formatBrandWindow` (F2).
- **`src/lib/labels.ts`** (new) — display maps `ROLE_LABELS`/`PLACEMENT_LABELS`/
  `ACH_TYPE_LABELS`/`BRAND_CATEGORY_LABELS`/`BRAND_STATUS_LABELS` + `STAFF_ROLES`;
  dev-only role-drift assertion (F3).
- **`src/lib/roster.ts`** (new) — pure transforms `toRosterMembers`, `groupRoster`,
  `splitHonours`, `memberHonourMap` (E4); imports `STAFF_ROLES` from labels.
- **`src/hooks/cleanup.ts`** (new) — `afterDelete` on Members + Organizations + Teams
  (E5 matrix), wired into each collection config.

**Checkpoint 0:** `npm run generate:types` (new Tenures/Brands collections — review F5) →
type-check → `devsafe` restart → confirm new fields render in admin.

---

## PHASE 1 — Legacy Rosters (items 4 & 5)

### Step 1.1 — Org detail route  → `src/app/(frontend)/orgs/[slug]/page.tsx`
SSG via `generateStaticParams` (reuse `getAllOrgSlugs`), `revalidate = 3600`,
`generateMetadata`. Cinematic header: banner/logo, accent gradient, founded year,
description, social links (mirrors the player page header pattern).

### Step 1.2 — `LegacyRoster` component  → `src/components/site/LegacyRoster.tsx`
Consumes `RosterMember[]` from `getOrgRoster`. Per-org **full** history:
- **Players** section + a separate **Staff (past & present)** section (**G1**: by
  `roleAtOrg` ∈ COACH / ANALYST / MANAGER). Owners → leadership/about, not this list.
- Within each: **Current** vs **Alumni** (alumni = `!isCurrent`), sorted oldest →
  newest by `joinedAt`.
- Founding members get a "Day one" badge (`isFounding`, per-org from the tenure).
- Each card shows the three asked-for things: **entry** → **exit** ("Present" when
  open; "2019–20 · 2022–present" for rejoins), the **achievements** earned (linked,
  count + list), plus avatar, IGN, `roleAtOrg`, **squad/game** (`team`), `note`, and
  a "Former member" tint when `!isCurrent` (D-A3).
- Dates render at month+year granularity (e.g. "Mar 2019 – Aug 2021").
- Links to the player's `/players/[slug]`.

> Note: **MANAGER** lives on the new `Tenure.role` enum (includes it from the start),
> so no change to the existing `Member.role` enum is required for G1.

### Step 1.3 — Org honours  → `src/components/site/OrgHonours.tsx`
The org's linked Achievements as a timeline (year, placement, title, game) on the
detail page.

### Step 1.4 — Link up + SEO
- `/orgs` grid cards → `/orgs/[slug]`.
- Org-page JSON-LD: `SportsOrganization` + roster `ItemList`.
- Editable intro copy via `PageIntros` (add an `orgs detail` group) or org fields.

**Checkpoint 1:** type-check; verify SouL & 8Bit legacy pages render from real data.

---

## PHASE 2 — Brand Engagement (items 1, 2, 3)

### Step 2.1 — `/brands` hub  → `src/app/(frontend)/brands/page.tsx`
All partnerships; client filter by org (reuse the plugins-style filter pattern).
Each card: brand logo, category, orgs, involved members (avatars), status.

### Step 2.2 — Per-org brand section
On `/orgs/[slug]`, a "Brand partnerships" block filtered to that org — this is
exactly "S8UL brand management" (2) and "8Bit Creative brand management" (3).

### Step 2.3 — Member "Brand work" tab
Add a tab to the player page's `ProfileTabs` listing brands the member is linked
to (reverse relation via `getMemberBrands`).

### Step 2.4 — Brand hub component  → `src/components/site/BrandGrid.tsx`
Shared card/grid used by hub + per-org section.

**Checkpoint 2:** type-check; verify a brand entered in admin shows on hub, the
right org page, and each involved member's page.

---

## PHASE 3 — Wiring & polish

- Nav: add **Orgs** (already) detail links + **Brands** entry (Navigation global).
- Editable copy for `/brands` + org detail intros (Globals / PageIntros).
- `withRevalidate(Brands)` confirmed; org/brand pages revalidate on edit.
- Final type-check + full click-through.

**Checkpoint 3:** sign-off.

---

## Data-entry checklist (one-time, after each phase ships)

- **Tenures**: one row per stint for **every** SouL & 8Bit member past & present —
  `member`, `org`, `team?`, `role`, `joinedAt` + `leftAt` (month+year; blank exit =
  current), `isFounding`, `note?`. (Edited inline on the Member via the `tenures` join.)
- Achievements: link each trophy to its `org`, `members`, `team?`, `game`, `type`,
  `placement`.
- Brands: create partnership records, attach `orgs` (≥1) + `members` + `team?`.

---

## Files touched (summary)

**New:** `collections/Tenures.ts`, `collections/Brands.ts`,
`app/(frontend)/orgs/[slug]/page.tsx` (+ `opengraph-image.tsx`),
`app/(frontend)/brands/page.tsx`, `components/site/LegacyRoster.tsx`
(+ `RosterMemberCard`), `components/site/OrgHonours.tsx`,
`components/site/BrandGrid.tsx` (+ `BrandsClient.tsx`),
`lib/roster.ts`, `lib/labels.ts`, `hooks/cleanup.ts`.
**Edited:** `collections/Members.ts` (tenures **join** field; no flat tenure fields),
`collections/Achievements.ts`, `collections/Organizations.ts` (optional `roster` join),
`payload.config.ts` (register Tenures/Brands + cleanup hooks + revalidate),
`lib/data.ts`, `lib/types.ts` (incl. `Org` extension), `lib/format.ts`,
`app/(frontend)/orgs/page.tsx` (OrgsGrid → detail links),
`components/site/RosterGrid.tsx` (role label), player profile page + `ProfileTabs`,
`globals/Navigation.ts`, `globals/PageIntros.ts`, `sitemap.ts`.

## Verification per phase
type-check (no DB) → `devsafe` restart for schema → manual admin entry → on-site
check. No dev server started by me (you run it).

## Completeness review (after wide research)

Checked against the existing schema + how real esports orgs present
roster / profile / partnership pages. Coverage and the remaining gaps:

**Model reconciliation (settle before coding):**
- **`Teams` exists** (`org` + `game`; "SouL BGMI", "S8UL Valorant") and Members
  link to it. Use it: each legacy card can show the **squad / game**, and S8UL's
  multi-game roster can group by team. SouL/8Bit are single-squad, so org-level
  still works — Teams is an enrichment, not a rewrite.
- **Owners exist twice:** Members with `role: OWNER` **and** the `Founders`
  collection. Brand "who" → relate to **Members** (one relation covers players +
  creators + owners). `Founders` stays the leadership/about list. Ensure any owner
  who does brand work exists as a Member(OWNER) so they're linkable.

**Gaps — DECIDED:**
- **G1 — Staff in legacy:** ✅ **YES.** Separate "Staff (past & present)" group
  (COACH/ANALYST/MANAGER via `Tenure.role`) on the org page, alongside players.
- **G2 — Achievement type:** ✅ **YES.** `type` (Team / Individual) on Achievements.
- **G3 — Brand scope:** ✅ **YES.** Optional `game` on Brands; show squad/game on
  legacy cards via the member's `teams`.

**Optional / nice-to-have (non-blocking, room left in model):**
- Player: total prize winnings, birth date. · Brand: tier (Title / Partner), region.

**Confirmed already covered:** IGN, real name, country, role, socials, full career
timeline (`career[]`), current-vs-alumni status, entry→exit at month+year, team
achievements (Achievements↔Members), brand hub + per-org + member tab, content/media
(existing YouTube/Instagram), leadership (Founders), per-org pages (this plan).

---

## Risks / notes
- Heavy one-time data entry (tenures, founding flags, trophy↔roster links) — model
  is front-loaded so entry is done once.
- Tabbed org/member panels reduce crawlable DOM (same trade-off as ProfileTabs);
  JSON-LD compensates for SEO.
- New relationships increase `depth` on some queries — keep `depth` tight in readers.
