# Deep-dive O — Query optimization & DB hygiene

Status: **DESIGN LOCKED** (added post-N for the larger structure — [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-O1** enable RLS deny-by-default on all tables · **D-O2** build **targeted
revalidation** now (edit→path matrix; globals stay broad).
Covers indexing, projections, N+1, pooling, revalidation-at-scale, **and** the Supabase
**RLS-disabled** lint. Scope: the bigger data shape from A–N (Tenures, Brands,
Achievement links, ~40 members / ~70 tenures).

---

## O0. Framing — where the cost actually is (don't micro-opt the wrong thing)

- **All public reads = Payload Local API** (in-process, no HTTP), behind **ISR
  `revalidate=3600` + static pages**. So **there is no per-request DB hot path** —
  served pages are static until revalidated. → Optimize **build / revalidate-time query
  cost** and **DB efficiency**, not request latency.
- **Connection:** Supabase session pooler, `postgres` role, `max: 4`. Build/revalidate
  concurrency (40 player pages + org pages regenerating) is the real pressure point, not
  query speed per se.
- **The RLS lint is security, not performance** (O7) — Payload bypasses PostgREST.

---

## O1. Indexing (the highest-leverage change)

Payload (postgres) stores `hasOne` relationships as FK columns and `hasMany` via
`*_rels` tables. FK columns are **not auto-indexed** → index the ones we filter/sort on:

| Collection | Add `index: true` on | Why |
|---|---|---|
| **Tenures** | `org`, `member`, `team`, `joinedAt` | `getOrgRoster` (where org), `getMemberTenures` (where member), sort by joinedAt |
| **Achievements** | `org` (+ existing `sortKey`, `slug`) | `getOrgAchievements` (where org, sort -sortKey) |
| **Brands** | `team`, `game`, `status` | scope filters + hub Active/Past filter |
| Members | `slug`,`featured` already indexed | — |

`hasMany` filters (`achievements.members`, `brands.orgs/members`) hit `*_rels` tables
which Payload indexes by parent/child — adequate. **Verify** the `*_rels` FK indexes
exist after `push` (psql `\d achievements_rels`); add a manual index if a query is slow.

---

## O2. `select` projections (trim payload)

Readers currently fetch full docs. For the heavy ones, add Payload `select` so we pull
only what the view needs:
- `getOrgRoster` → tenure: `{ role, joinedAt, leftAt, isFounding, note, member, team }`;
  member (depth) only `{ ign, slug, avatar, country, isActive, role }`.
- `getBrands`/`getBrandsByOrg` → omit nothing heavy (brands are small) — low priority.
- `getAllMemberSlugs`/`getAllOrgSlugs` already `select: { slug }`. Good pattern to copy.

Cuts JSON size + serialization at build for the 40-member rosters.

---

## O3. Depth discipline & N+1 (codify the rules)

- **Lowest depth that populates what's rendered.** `getOrgRoster` needs `depth: 2`
  (tenure→member→avatar, tenure→team→game) — keep it, but pair with O2 `select`.
- **Invert, don't loop:** org page builds `memberHonourMap` from **one**
  `getOrgAchievements` (E4) instead of N per-member queries. Org page = **4 reads total**
  in `Promise.all` (E3). This is the rule for every new aggregate surface.
- **Counts come from already-fetched data** (header member/title counts derive from the
  grouped roster + teamHonours — no extra `count()`).

---

## O4. Targeted revalidation (D-O2 LOCKED — build now)

Replace the broad `revalidatePath('/', 'layout')` for **content collections** with an
**edit → path** mapping, so a Tenure edit refreshes only the relevant org + member, not
all 60+ pages. **Globals stay broad** (nav/site-settings touch the shared layout).

**Strategy split by edit frequency (revalidation audit — review pass 4):** targeting is
only worth its risk for **high-frequency / many-record** collections. **Near-static**
collections just **broad-purge** (rare edits → the wide regeneration is cheap, and it's
always-correct — no missed surface).

| Collection edited | Strategy → revalidate paths |
|---|---|
| **Members** | **targeted** — `/players/[slug]`, `/players`, `/`, **every org in the member's tenures** (`/orgs/[orgSlug]` — an alumnus appears on *multiple* org legacy pages, not just `member.org`!), **+ `/brands`** if the member is on any brand |
| **Tenures** | **targeted** — the tenure's `/orgs/[orgSlug]` + `/players/[memberSlug]` |
| **Achievements** | **targeted** — linked `/orgs/[slug]` + each linked `/players/[slug]` + `/achievements` + `/` (titles stat) |
| **Brands** | **targeted** — `/brands` + each linked `/orgs/[slug]` + each linked `/players/[slug]` |
| **Organizations / Teams / Games / Founders / Matches / Pages** | **broad purge** — near-static; org/team **name shows on member pages + /brands + grids**, so a precise map is fan-out-heavy and error-prone → just `revalidatePath('/', 'layout')`. Rare edits. |
| **Globals** (any) | broad `revalidatePath('/', 'layout')` (shared layout) |

**Audit findings fixed above:** (1) a Member edit must fan out to **all tenure-orgs** (a
renamed/re-avatared alumnus shows on every org legacy page they were on) **+ `/brands`**
(brand member avatars) — not just `member.org`; (2) **Organizations/Teams** carry names
onto member pages, grids and brand cards, so they're moved to **broad purge** rather than
an incomplete targeted map.

**Implementation (`src/lib/revalidate.ts` rework):**
- Per-collection resolver builds the path list from the changed `doc`. Relationship
  fields arrive as **ids** → the hook does **small `depth:0` slug lookups** (org/member
  by id) to build `[slug]` paths. Admin edits are rare → these lookups are cheap.
- **Member resolver fans out:** query the member's **tenures** (→ all org slugs) **and
  brands** (→ `/brands`) so an alumnus edit refreshes every org legacy page + the brand
  hub, not just `member.org`. (One extra tenures query per member edit — fine off the hot
  path.)
- **Only Members/Tenures/Achievements/Brands are targeted**; Orgs/Teams/Games/Founders/
  Matches/Pages call the broad purge directly (the matrix above).
- **⚠ afterDelete ordering (review F11):** on a **Member delete**, E5's cleanup hook
  **deletes the member's tenures first**, then `withRevalidate`'s purge runs (L: cleanup
  composes before revalidate) → the F9 fan-out would query tenures and **find none** →
  miss the org legacy pages. **Fix: Member `afterDelete` → broad purge** (deletes are
  rare; `afterChange` stays targeted). Tenure/Achievement/Brand deletes are fine — the
  deleted `doc` itself still carries its org/member ids for the fan-out. So: **targeted on
  change; Member-delete = broad; other deletes use the doc's own ids.**
- **Safety fallback:** if slug resolution throws / a relation is missing → **fall back to
  the broad purge** (never serve stale). Keep the whole thing try/catch (seed-safe).
- **Cascade interplay (E5):** a member delete cascades to tenure deletes → each fires its
  own targeted revalidate; the member's own afterDelete revalidates its org/player paths.
  Generous-but-bounded; no stale surface.
- Keep `withRevalidate` as the wrapper, but it now calls the **collection-aware**
  resolver instead of a blanket purge; `withGlobalRevalidate` stays broad.

> Trade-off accepted: more code + an auditable matrix to maintain, in exchange for not
> regenerating 60+ pages on every small edit. Resolves CLAUDE.md's deferred
> tag-invalidation note.

---

## O5. Pooling & build concurrency

- `max: 4` on the session pooler protects Supabase's 15-client cap, but **parallel SSG
  builds** of 40+ pages can queue on it → slower builds, not errors.
- **Prod/Vercel:** switch `DATABASE_URL` to the **transaction pooler (6543)** (CLAUDE
  already notes this for deploy) — better for many short build queries; raise `max` there.
- Keep `Promise.all` per page (parallel within a page), but the **page-to-page**
  concurrency is Next's build worker count — fine with the transaction pooler.
- **YouTube build quota (review F7):** 40+ alumni player pages each call `getYouTube` at
  build/revalidate. It's key-gated + quota-cheap (playlistItems+videos.list, not search),
  but watch the **40× at build**; alumni stubs without a YT social skip the call (returns
  `null`). If quota bites, gate YT to `isActive`/featured members or cache results.

---

## O6. Misc query rules (codify in data.ts)

- Always set an explicit `limit` (no unbounded finds); rosters `limit: 1000` is safe.
- `depth: 0` for slug-only / count-only reads.
- Prefer `payload.count()` over `find().totalDocs` when only a number is needed.
- One reader = one query (or a fixed small set); never a query inside a `.map`.

---

## O7. RLS / PostgREST exposure (the lint) — security fix

**Lint:** `public.achievements` (and **every** Payload table) has **RLS disabled** while
the `public` schema is exposed via Supabase PostgREST → the **anon key could read/write
these tables over Supabase's REST API**, bypassing Payload's access control.

**Why Payload is unaffected by the fix:** Payload connects as the **`postgres` role
(superuser)**, which **bypasses RLS**. So enabling RLS closes the anon hole without
touching Payload's Local API.

**Fix (D-O1):** **enable RLS, deny-by-default** on all Payload tables (no `anon`/
`authenticated` policies) so PostgREST returns nothing to public clients:
```sql
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
-- …repeat for every Payload table incl. new tenures, brands, *_rels…
```
- Apply via a **Payload migration** (`payload migrate:create`) or a one-off SQL run
  **after** `push`, and **re-apply for new tables** (Tenures, Brands, their `_rels`).
- **Alternatives:** (b) `REVOKE` all on schema `public` from `anon`/`authenticated`
  (blunt, same effect); (c) stop exposing `public` via PostgREST (Supabase API settings)
  / move Payload to an unexposed schema (heavier). RLS-enable is the lint's intended fix.
- ⚠ Since this site **never uses Supabase PostgREST** (Payload Local API only), enabling
  RLS is pure upside — no app code depends on the REST API.

---

## O8. Deltas

- **Collections:** add `index: true` to the O1 fields (Tenures/Achievements/Brands) —
  part of building those collections (Phase 0), not a separate pass.
- **`lib/data.ts`:** add `select` to `getOrgRoster` (+ heavy readers); keep the
  invert-map / Promise.all rules.
- **Security:** RLS migration (O7) — a Phase-0/deploy checklist item; re-run on new tables.
- **Revalidation:** D-O2 decides broad vs targeted.

---

## O-decisions — LOCKED

- **D-O1** ✅ **Enable RLS deny-by-default** on all Payload tables (incl. new Tenures/
  Brands/`_rels`), via a migration re-applied on new tables. Payload (postgres superuser)
  bypasses RLS; closes the anon PostgREST hole.
- **D-O2** ✅ **Build targeted revalidation now** — edit→path matrix (O4); globals stay
  broad; broad-purge fallback on resolution failure.
