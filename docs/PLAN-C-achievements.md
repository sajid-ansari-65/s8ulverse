# Deep-dive C — Achievements model

Status: **DESIGN LOCKED** (agenda item C of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Builds on **A** (Tenures) — legacy cards show a member's honours *at an org*.
Locked: **D-C1** Team-on-org / Individual-on-player · **D-C2** optional `team` link ·
**D-C3** keep `category`.

---

## C0. Current state (verified)

`Achievements` today: `title`, `slug`, `year` (text), `category` (freeform text —
"EWC, BGMI, Awards"), `description`, `sortKey`. Rendered by `Timeline` on
`/achievements` (and feeds the homepage). **Not linked to anyone.**

The seed already proves both shapes exist:
- **Team / org award:** `content-group-4x` — Content Group of the Year ×4 (org-level,
  no specific roster, no game).
- **Individual award:** `personality-2025` — Esports Personality of the Year → a
  single person (8bit Thug).

So `type = Team | Individual` (G2) is grounded in real data, not hypothetical.

---

## C1. New fields on `Achievements`

Keep everything; **add** structured links (all additive):

| Field | Type | Req | Notes |
|---|---|---|---|
| `org` | relationship → organizations | — | which family org won it. Optional: a pure individual award (pre-S8UL personal honour) may have none. |
| `members` | relationship → members (hasMany) | — | who earned it. Team trophy = the roster; individual = one person; org milestone = empty. |
| `team` | relationship → teams | — | **D-C2:** precise squad (e.g. iQOOSouL BGMI) — more exact than `org`, lets the org page group honours by squad. `filterOptions` → teams of `org`. |
| `game` | relationship → games | — | BGMI / Valorant; **null** for non-game awards (Content Group). |
| `type` | select | ✅ | **Team / Individual** (default Team). Drives display. |
| `placement` | select | — | Champion / Runner-up / Top 3 / Qualified. **Null for awards** (Personality isn't a placement). |
| `category` | text (existing) | — | **kept** as a freeform label/badge ("Awards", "EWC", "Tier-1"). Partly superseded by `game`/`type` but seed relies on it and it's useful display sugar — not dropped (D-C3). |
| (`title`/`slug`/`year`/`description`/`sortKey`) | — | — | unchanged |

`org`, `team`, `game`, `members` all **optional** so every existing row stays valid
and any mix (org-only milestone, member-only award, full team trophy) is expressible.

---

## C2. The display rule (the real open question — D-C1)

A team trophy (BGIS 2026) links org=SouL, members=[5 players], game=BGMI, type=Team.
Without a rule it repeats: once in OrgHonours **and** on all 5 roster cards on the
**same** org page. Proposed rule:

| Surface | Shows |
|---|---|
| **Org page → OrgHonours** | **Team** honours of the org, grouped by year (placement badge + small winner avatars). **Not** the per-player repetition. |
| **Org page → roster card** (from A) | a compact **🏆 N** count of team trophies *earned at this org* + inline chips for that player's **Individual** honours. No full team-trophy list (the timeline already has it). |
| **Player profile page** | the player's **full** honours, split **Team honours / Individual honours** (year · placement · game · org). The only place with no org timeline, so no repetition. |
| **Global `/achievements`** | unchanged all-honours timeline (optional later: filter by type/org/game). |

Net: each trophy appears **once per context** — org timeline (team), player card (count
+ individual), player page (full). No same-page 5× repeat.

> Individual honours stay on **player** surfaces (card chip + profile), **not** in
> OrgHonours — keeps the org timeline about squad silverware. (If you'd rather show an
> "Individual honours" block on the org page too, that's the alt for D-C1.)

---

## C3. Member-at-org honours (how A's legacy cards get data — no N+1)

A player's honours *for an org* = `achievements where members∋player AND org==thatOrg`.
But the legacy roster has many players — querying per player is N+1. Instead:

- The **org page** fetches `getOrgAchievements(orgId)` **once** (depth to populate
  `members` ids + `game`/`team`).
- In app, build `Map<memberId, Achievement[]>` from those rows → pass each roster card
  its **count** (team) + **individual chips**. One query, not N.
- The **player page** uses `getMemberAchievements(memberId)` (unscoped, all orgs) for
  the full split.

---

## C4. Readers (`src/lib/data.ts`)

- `getOrgAchievements(orgId)` → `where:{ org:{equals:orgId} }`, `sort:'-sortKey'`,
  `depth:1` (members/game/team). Used by OrgHonours **and** the roster-card map.
- `getMemberAchievements(memberId)` → `where:{ members:{ in:[memberId] } }`,
  `depth:1`. (⚠ verify Payload hasMany operator — expect `in`/`equals`; if not,
  `contains`. Cheap to confirm.) Used by the player page; split by `type` in app.
- `getAchievements()` (existing global timeline) → unchanged.

---

## C5. View types (`src/lib/types.ts`)

```ts
export interface Achievement {
  title: string
  slug: string
  year: string
  category?: string | null
  description?: string | null
  type: 'Team' | 'Individual'
  placement?: string | null
  org?: Org | string | null
  team?: TeamDoc | string | null
  game?: { name: string; slug: string } | string | null
  members?: (Member | string)[] | null
}
```
Helpers: `splitHonours(list)` → `{ team, individual }`; `memberHonourMap(orgAch[])` →
`Map<number, Achievement[]>`.

---

## C6. Migration & seed

- **Migration:** new relationship tables (org/members/team/game) + enums for
  `type`/`placement`. **Additive** → safe `push`; `devsafe` restart.
- **Seed backfill:** wire the two known rows — `content-group-4x` (type Team,
  org=s8ul, no game/placement) and `personality-2025` (type Individual,
  members=[8bit-thug]). Real per-trophy rosters (BGIS 2026 → the 5 players) come from
  **Deep-dive M (sourcing)**; seed encodes what's known, leaves the rest to admin.
- `type` defaults to `Team`; existing rows become Team unless edited.

---

## C7. Edge cases & integrity

1. **Member-only award, no org** → shows on player page, on no org page. ✓
2. **Org milestone, no members** (Content Group) → OrgHonours only, no per-player
   attribution. ✓
3. **One trophy, one `org`** (single relationship, not hasMany) — a jointly-S8UL
   trophy picks the umbrella org. Keep `org` single.
4. **`placement` null for awards** — display falls back to `type` + `title`.
5. **`team`↔`org` mismatch** — `filterOptions` by `siblingData.org`; fallback validate.
6. **Delete integrity:** deleting a Member should not leave stale ids in
   `achievements.members`. Same concern as Tenures (A9.1) — verify whether Payload
   prunes hasMany relationship refs on delete; if not, extend the Members `afterDelete`
   hook to also pull the id from referencing achievements. **Shared integrity task.**
7. **Revalidation:** `Achievements` is already wrapped by `withRevalidate` (existing).
   Confirm the new links still purge org/player pages (broad layout purge → yes).

---

## C8. Deltas to the master plan

- **Step 0.3** (Achievements links) → extended: add `team` + the `type` default +
  `category` kept; note the display rule lives here.
- **Step 0.5 readers** → `getOrgAchievements`, `getMemberAchievements` (+ the
  no-N+1 map built on the org page).
- **Phase 1** OrgHonours = Team honours; roster card = count + individual chips.
- **Phase (profile page)** gains a Team/Individual honours split — overlaps the
  `career[]` narrative; reconcile in **Deep-dive J** (member profile page additions).
- Forward note to **D (Brands):** the SouL BGMI squad is sponsor-named "iQOOSouL"
  (seed) — naming-rights is a Brands concern; keep team display name vs sponsor name
  in mind there.

---

## C-decisions — LOCKED

- **D-C1** ✅ OrgHonours = **Team** honours only; individual honours live on player
  card chips + the player page's Team/Individual split.
- **D-C2** ✅ Achievements get an optional `team` link (filtered to the org).
- **D-C3** ✅ Keep freeform `category` alongside `game`/`type`.
