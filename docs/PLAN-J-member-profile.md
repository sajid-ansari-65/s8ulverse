# Deep-dive J — Member profile page additions

Status: **DESIGN LOCKED** (agenda item J of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-J1** keep Journey + new structured Tenure tab (replaces Squads) ·
**D-J2** honours as a featured section above the tabs.
The audit pulled all player-page edits here so the page isn't touched piecemeal.
Adds to `app/(frontend)/players/[slug]/page.tsx`: brand-work (D), tenure history (A),
honours split (C), Former-member badge (A), role labels (F) — and resolves the
`career[]`↔`tenures` overlap. Reuses the shared honour badge (I).

---

## J0. Current page (verified)

Cinematic header (pills: raw `member.role`, position, verified, org · "Active since
{joinedAt}") → bio lead → **`ProfileTabs`**: **Journey** (`career[]`), **Channel** (YT),
**Instagram**, **Squads** (`member.teams` flat list), **Social**. Tabs render only when
they have content.

---

## J1. Data additions (Promise.all)

Currently: `getMemberBySlug` + `getYouTubeChannels`. Add:
- `getMemberTenures(member.id)` → `Tenure[]` (A/E) — full org/stint history
- `getMemberAchievements(member.id)` → `Achievement[]` (C/E) → `splitHonours` →
  `{ team, individual }` (E4)
- `getMemberBrands(member.id)` → `Brand[]` (D/E)

All `depth: 1`; run in parallel with the existing reads.

---

## J2. Header tweaks

- **Role label:** `<Pill ember>{ROLE_LABELS[member.role] ?? member.role}</Pill>` (F4),
  replacing the raw value.
- **Former-member badge (D-A3):** when `!member.isActive` (left the family) →
  `<Pill ghost>Former member</Pill>` + slightly muted header accent. (Org-scoped
  "alumni" is the org-roster card's job; the profile badge is family-level `isActive`.)
- "Active since {joinedAt}" stays (family-join, day-precision `formatDate`).

---

## J3. Honours — featured section (D-J2)

Placement per D-J2: a prominent **honours section right after the bio lead** (not buried
in a tab), since honours are the headline of a profile.
- `Team honours` row + `Individual honours` row (from `splitHonours`), using the **shared
  placement badge / trophy chip** from I (`PlacementPill`).
- Each: title · year · placement · game · (org context when multi-org).
- Hidden entirely when the member has no honours.

> If D-J2 = "tab" instead, this becomes an **Honours** tab in J4 rather than a section.

---

## J4. Tabs — resolving career[] vs tenures (D-J1)

Recommended structure (keeps narrative + factual, non-redundant):
- **Journey** (existing `career[]`) — unchanged; the human narrative ("Founded Team
  SouL", "Co-founded S8UL"). Stays as colour.
- **Replace the thin "Squads" tab with a "Tenure" tab** — structured org history from
  `getMemberTenures`: per stint show **org** (logo + name, link to `/orgs/{slug}`),
  **role** (`ROLE_LABELS`), **range** (`formatStints`/`formatTenureRange`), **team**
  (`asTeam`), **Day-one** badge (`isFounding`). This supersedes the flat `member.teams`
  list (tenures carry org+team+dates). Sorted newest→oldest (recent stint first).
  - **`member.teams` disposition (cross-check flaw):** once the Squads tab is gone,
    `member.teams` has **no frontend consumer**. "Current squads" now derive from **open
    tenures** (`tenure.team` where `!leftAt`). Keep `member.teams` as **admin-only /
    legacy** (no migration, no removal) but **stop rendering it**. Documented in CLAUDE.md.
- **Brands** tab (new) — `getMemberBrands` rendered via the I `BrandGrid` (compact):
  the member's brand work. Hidden when empty.
- **Channel / Instagram / Social** — unchanged.

So `career[]` = narrative (Journey), `tenures` = facts (Tenure tab) — **no competing
double timeline**; the old Squads tab is upgraded, not duplicated.

> Tab-count watch: Journey · Tenure · Brands · Channel · Instagram · Social (+ Honours
> if D-J2=tab). All content-gated, so most members show 2–4. ProfileTabs already
> handles a variable set; if overflow is ugly we wrap (note, not a blocker).

---

## J5. JSON-LD enrichment (optional, cheap)

The page already emits `Person` + `memberOf SportsOrganization` + `BreadcrumbList`. Add:
- `award: honours.map(h => h.title)` on `Person` (honours we now have linked).
- `memberOf`: list **all** orgs from `tenures` (not just current `org`) → richer entity
  graph; each `@id` matches the org page's `#org` (G5) so the graph interlinks.

---

## J6. Edge cases

1. **Multi-org member** (MortaL) → Tenure tab lists every stint (SouL founder + S8UL
   current); honours aggregate across orgs; `memberOf` lists both.
2. **Former member** (`!isActive`) → badge + muted accent; page stays live/SSG (already
   the case — `getAllMemberSlugs` has no isActive filter).
3. **No honours / no brands / no career / no tenures** → those sections/tabs hidden.
4. **career present but tenures empty** (legacy data not yet entered) → Journey shows,
   Tenure tab hidden — graceful during the data-entry ramp (M).
5. **Honour `members` populated** already (depth 1) — but here we query
   `getMemberAchievements` directly, so no map needed.

---

## J7. Deltas

- **Edited:** `players/[slug]/page.tsx` (data + header + honours section + tabs + JSON-LD).
- **Reuses:** `BrandGrid` (I), `PlacementPill`/honour badge (I), `formatStints`/
  `formatTenureRange`/`formatBrandWindow` + `ROLE_LABELS` + `asTeam`/`resolveMany` (F),
  `splitHonours` (E4).
- **New readers:** none (all from E). The old "Squads" tab code (reading `member.teams`)
  is removed in favour of the Tenure tab.

---

## J-decisions — LOCKED

- **D-J1** ✅ Keep **Journey** (`career[]` narrative) + a new structured **Tenure** tab
  (org/role/range/team/Day-one) that **replaces** the flat Squads tab. No merged
  double-timeline.
- **D-J2** ✅ Honours = **featured section above the tabs** (Team / Individual split).
