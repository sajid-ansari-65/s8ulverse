# Deep-dive G — Org detail page (`/orgs/[slug]`)

Status: **DESIGN LOCKED** (agenda item G of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-G1** stacked sections + sticky anchor sub-nav · **D-G2** dedicated org
`opengraph-image.tsx`.
The shell every Phase-1/2 component mounts into; first consumer of the A–F foundation.
Template: the existing player page (`players/[slug]/page.tsx`) — same SSG + cinematic
header + JSON-LD shape, org-flavoured.

---

## G0. Template & gaps found

- **Reuse the player-page pattern verbatim:** `revalidate = 3600`,
  `dynamicParams = true`, `generateStaticParams` (→ `getAllOrgSlugs`, exists),
  `generateMetadata`, `JsonLd` @graph, cinematic `<header>` (banner/accent backdrop +
  ghost text + mark + pills + meta row), back-link, lead, then content.
- **Gap 1 — `Org` view type is too thin.** `types.ts` `Org` lacks `banner` + the social
  links the collection has (`website/twitter/instagram/youtube`). **Extend `Org`** (G2)
  — additive, safe (grid readers just ignore the extra fields).
- **Gap 2 — sitemap excludes `/orgs/[slug]`** by design ("no per-org route yet"). G
  adds it (L consolidates all sitemap/robots changes, but G owns this line).
- **No routing conflict:** the root catch-all is `(frontend)/[slug]` (top-level);
  `/orgs/[slug]` is nested. Pages already reserve the `orgs` slug, so an admin Page
  can't shadow it.

---

## G1. Route & data

`src/app/(frontend)/orgs/[slug]/page.tsx`

```
generateStaticParams → getAllOrgSlugs()            // SSG one page per org
page data (Promise.all):
  getOrgBySlug(slug)        → Org | null  (notFound() if null)
  getOrgRoster(org.id)      → RosterMember[]        (E)
  getOrgAchievements(org.id)→ Achievement[]         (E/C)
  getBrandsByOrg(org.id)    → Brand[]               (E/D)
derive:
  accent = org.accentHex ?? '#ff5a36'; banner/logo via mediaUrl
  { players, staff } = groupRoster(roster)          (E4)
  honourMap = memberHonourMap(orgAch)               (E4 — roster-card counts, no N+1)
  { team: teamHonours } = splitHonours(orgAch)      (E4 — OrgHonours input)
```

One page = **4 reads**, parallel. Roster-card honour counts come from the single
`getOrgAchievements` result — no per-player query.

---

## G2. `Org` view-type extension  → `src/lib/types.ts`

```ts
export interface Org {
  /* …existing… */
  banner?: MediaDoc | string | null
  website?: string | null
  twitter?: string | null
  instagram?: string | null
  youtube?: string | null
}
```
`getOrgBySlug` runs `depth: 1` → `logo` + `banner` uploads populate. (Folds into E's
type set; flagged here because G is what needs it.)

---

## G3. Page composition (stacked, crawlable — see D-G1)

1. **JSON-LD** (G5).
2. **Cinematic header** — banner-or-accent backdrop, ghost `org.shortName ?? org.name`,
   **logo mark** in the portrait slot (fallback `Initial`), pill row
   (`Verified` · `Founded {founded}` · `{players.current.length} members` ·
   `{teamHonours.length} titles`),
   big `org.name` (display), `shortName` sub, meta row (founded + social links from the
   new Org fields). Mirrors the player header 1:1.
3. **Back-link** "← All organizations" → `/orgs`.
4. **Lead** — `org.description` as the large display lead (like the player `bio`).
   - **Leadership line (review F4):** a small "Founded by … / Owners: …" line from the
     org's founder/owner Members (those with an `OWNER` tenure at this org, or `Founders`),
     since owners are excluded from the roster list (H) and otherwise appear nowhere here.
5. **(optional) micro stat-strip** — members · titles · active squads (small). Decide
   inline; low cost. Hidden if all zero.
6. **`LegacyRoster`** (H) — receives the grouped `players` / `staff` (G owns
   `groupRoster`) + `honourMap` + `accent`. The centrepiece (asks 4–5).
7. **`OrgHonours`** (I) — `teamHonours` **trophy-cabinet grid** (C rule: team trophies
   here, with winner avatars).
8. **Brand partnerships** (I/D) — `BrandGrid` of `getBrandsByOrg` (asks 2–3).
9. Spacer.

> Section labels (Roster · Honours · Partnerships) + the lead kicker come from the
> Page-Intros **`orgDetail`** group (K, D-K2) — editable, with constant fallbacks.

> **Layout (D-G1):** stacked sections with a small sticky **anchor sub-nav**
> (Roster · Honours · Partnerships) — **[recommended]** over tabs, because (a) the
> roster is the primary content, (b) tabs hide content from crawlers (the ProfileTabs
> SEO trade-off), and (c) JSON-LD + a crawlable roster matter for org SEO.

---

## G4. Empty states

- **No roster** (shouldn't happen) → roster section shows an OrgsGrid-style "add
  members in /admin" message.
- **No honours** → `OrgHonours` section omitted entirely.
- **No brands** → Brand section omitted.
- Sub-nav chips only render for sections that exist.

---

## G5. JSON-LD (`SportsOrganization` + breadcrumb)

```
@graph:
  { '@type':'SportsOrganization', '@id': `${siteUrl}/orgs/${slug}#org`,
    name, alternateName: shortName, foundingDate: founded, url, logo,
    sameAs: [website,twitter,instagram,youtube].filter,
    member: players.map(p => ({ '@type':'Person', name: p.member.ign,
                                url: `${siteUrl}/players/${p.member.slug}` })) },
  { '@type':'BreadcrumbList', itemListElement: [S8ULverse, Organizations(/orgs), org.name] }
```
The `#org` @id **matches** the player page's `memberOf SportsOrganization`, so the
two graphs connect (nice SEO; player already emits `memberOf`).

---

## G6. Metadata & OG (D-G2)

- `generateMetadata`: `title = org.name + ' — Roster, Honours & Partnerships'`,
  `description = org.description ?? generated`, `canonical /orgs/${slug}`, `keywords`,
  `openGraph` (type `website`, url) — **omit `openGraph.images`** so a sibling
  `opengraph-image.tsx` wins (player-page convention).
- **D-G2 — Org OG card:** build `orgs/[slug]/opengraph-image.tsx` (branded card: logo,
  name, accent, "{N} members · {M} titles") for parity with players **[recommended]**;
  vs rely on the site-default OG.

---

## G7. Wiring & deltas

- **`/orgs` grid → detail links:** `OrgsGrid` currently links nowhere — wrap each card
  in `<Link href={'/orgs/' + org.slug}>` (part of Phase 1 Step 1.4 / H).
- **Sitemap:** import `getAllOrgSlugs`, emit `/orgs/${slug}` (priority ~0.7); remove the
  "no per-org route" comment. (Executed in L with the `/brands` entry.)
- **Revalidation:** org pages already purge via the broad layout revalidate; Tenures +
  Brands wrapped `withRevalidate` (A/D) so roster/brand edits refresh org pages.
- New file: `orgs/[slug]/page.tsx` (+ optional `opengraph-image.tsx`). Type delta: `Org`
  (G2). Component deps: H, I (designed next).

---

## G-decisions — LOCKED

- **D-G1** ✅ Stacked sections (Roster → Honours → Partnerships) with a small sticky
  anchor sub-nav; everything crawlable, roster as hero.
- **D-G2** ✅ Dedicated `orgs/[slug]/opengraph-image.tsx` branded card (logo · name ·
  accent · "N members · M titles").
