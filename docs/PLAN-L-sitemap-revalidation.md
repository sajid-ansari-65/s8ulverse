# Deep-dive L — Sitemap + revalidation

Status: **DESIGN LOCKED** (agenda item L of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Pure infra — **no user-facing decisions**. Ties off route emission + cache purging for
the new pages.

---

## L0. Current state (verified)

- **`sitemap.ts`** emits `STATIC_PATHS` (`/ /players /orgs /ewc /achievements /about`)
  + `/players/{slug}` + published Page slugs. Has an explicit comment: *"Orgs have a
  listing page but no per-org detail route yet, so we don't emit /orgs/[slug]."*
- **`robots.ts`** allows all, disallows `/admin/ /api/`, points at `/sitemap.xml`.
- **`revalidate.ts`** — `withRevalidate(c)` appends `afterChange` + `afterDelete` hooks
  that call `revalidatePath('/', 'layout')` → **purges the whole site** (broad on
  purpose; comment says over-invalidation is cheaper for this low-traffic curated site).
  try/catch so seed/tsx scripts no-op. `withGlobalRevalidate` does the same for globals.

---

## L1. Sitemap changes

- Add **`/brands`** to `STATIC_PATHS` (priority 0.8, index page).
- Emit **`/orgs/{slug}`** for every org — import `getAllOrgSlugs`, add to the
  `Promise.all`, map to entries (priority ~0.7, like players).
- Remove the stale "no per-org route" comment.
- `/orgs/[slug]` and `/brands` are crawlable (robots already allows them) → **no robots
  change**. Org OG images (`opengraph-image.tsx`) are not sitemap entries (correct).

```
STATIC_PATHS += '/brands'
const [memberSlugs, pageSlugs, orgSlugs] = await Promise.all([
  getAllMemberSlugs(), getAllPageSlugs(), getAllOrgSlugs(),
])
...orgSlugs.map(slug => ({ url: `${base}/orgs/${slug}`, lastModified: now, priority: 0.7 }))
```

---

## L2. Revalidation wiring

> **⚠ Superseded by O §O4 (review pass 5, F12).** This doc originally specced the broad
> `revalidatePath('/', 'layout')` purge for everything. **Deep-dive O changed the strategy
> to TARGETED revalidation** for Members/Tenures/Achievements/Brands (broad only for
> near-static collections + globals, and on Member-delete). **O4 is authoritative** for
> the revalidation strategy; L only owns the **sitemap** changes (L1) + the registration
> note below.

`payload.config.ts` collections array gains `withRevalidate(Tenures)` and
`withRevalidate(Brands)` (Achievements/Members/Orgs/Teams already wrapped). The wrapper
now routes to O4's **collection-aware resolver** (targeted vs broad per the O4 matrix),
not a blanket purge. Broad layout purge still revalidates all nested SSG routes when used.

---

## L3. ⚠ Interaction with E5 cleanup hooks (the one real subtlety)

Members / Organizations / Teams will have **two** `afterDelete` sources:
1. their **own** cleanup hook (E5, `hooks/cleanup.ts`), and
2. the **`revalidateAfterDelete`** appended by `withRevalidate`.

`withRevalidate` **composes** (`afterDelete: [...(c.hooks?.afterDelete ?? []),
revalidateAfterDelete]`) → it **preserves** the collection's own hooks and appends the
purge. So:
- **Define the cleanup `afterDelete` in the collection config**, then wrap with
  `withRevalidate` in `payload.config.ts` → both run (cleanup first, purge second). ✓
- The cleanup's cascade deletes (e.g. org → its tenures/teams) each fire their **own**
  `withRevalidate` purge — redundant but harmless (idempotent; `purge()` just re-marks
  the layout stale). No infinite loop (delete cascade is acyclic, E5 §E5).

> Net: no ordering bug, no double-definition — the wrapper was built to compose. Just
> ensure cleanup hooks live in the collection files (not added separately in config).

---

## L4. Revalidation strategy — see O §O4 (NOT unchanged)

~~Keep the broad layout purge.~~ **Updated (F12):** with +40 pages, **O §O4 moves to
TARGETED revalidation** (Members/Tenures/Achievements/Brands), broad only for near-static
collections, globals, and Member-deletes. O4 is the source of truth; this section defers
to it.

---

## L5. Deltas

- **Edited:** `app/(frontend)/sitemap.ts` (+ `/brands`, `/orgs/{slug}`, drop comment);
  `payload.config.ts` (`withRevalidate(Tenures)` + `withRevalidate(Brands)`).
- **Unchanged:** `robots.ts` (already permits the new routes); `revalidate.ts`
  (mechanism reused as-is).
- **No decisions** — mechanical.
