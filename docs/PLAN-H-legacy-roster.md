# Deep-dive H — `LegacyRoster` component

Status: **DESIGN LOCKED** (agenda item H of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-H1** two tiers (hero current / compact alumni) · **D-H2** compact card grid
for alumni. `RosterMemberCard` has `variant: 'hero' | 'compact'`.
The heart of asks 4 & 5 — every player & staff member of an org, from day one to now,
with entry → exit + honours. Consumes A (tenures), C (honours), E (`groupRoster`,
`memberHonourMap`), F (formatters, `ROLE_LABELS`, `STAFF_ROLES`).

---

## H0. Visual idiom (from `RosterGrid`)

Reuse the tokens: `TiltCard` + `Reveal` motion, `Initial` avatar fallback, `Pill`
(`ember`/`ghost`/`solid`), `accent = org.accentHex`, image cards with a
`from-ink` gradient overlay, mono uppercase meta. **But** `RosterGrid` takes `Member[]`
and shows no tenure/honours → `LegacyRoster` needs its own `RosterMemberCard`
(stylistically aligned, data-richer).

---

## H1. Props & structure

```tsx
<LegacyRoster players={RosterGroup} staff={RosterGroup} honourMap={Map<string, Achievement[]>} accent={string} />
// RosterGroup = { current: RosterMember[]; alumni: RosterMember[] }
```
- **G owns `groupRoster`** (it already needs the groups for the header member/title
  counts + JSON-LD), and passes the grouped `{ players, staff }` down. H **does not
  re-group** — it just renders. (Resolves the earlier G/H double-call.) Each group is
  pre-sorted oldest→newest by `joinedAt`.
- Root `<section id="roster">` (target of G's sticky sub-nav).
- Renders up to four labelled blocks (omit empties):
  - **Players → Current** · **Players → Alumni**
  - **Staff → Current** · **Staff → Alumni**  (only if any staff exist)
- Section headers are mono kickers ("Current roster", "Alumni", "Staff").

---

## H2. `RosterMemberCard` anatomy

Each card (links to `/players/{slug}`) shows, from the locked specs:
- **avatar / `Initial`**, **IGN** (display), **realName** (optional, dim)
- **role** — `m.position ?? ROLE_LABELS[roleAtOrg] ?? roleAtOrg` (F4)
- **tenure** — `formatStints(stints)` → "Mar 2019 – Present" / "2019–20 · 2022–present" (F2)
- **"Day one" badge** when `isFounding` (`Pill ember`)
- **"Former" tint** when `!isCurrent` (muted card + `Pill ghost` "Former") — D-A3
- **squad/game chip** — `asTeam(team)?.name` (+ game) e.g. "Team iQOOSouL"
- **honours** (C rule): `honourMap.get(String(member.id))` → **🏆 N** count of **Team** trophies
  + inline chips for **Individual** honours (title/year). No full team-trophy list
  (OrgHonours owns that). Omitted when none.

**Density (D-H1/D-H2 locked):**
- **Players → Current** = **hero image cards** (image-dominant, ~RosterGrid scale) — the
  active lineup celebrated.
- **Players → Alumni** = **compact card grid** (smaller card, muted/"Former" tint,
  avatar thumb + name + tenure + 🏆count). Many people → dense + scannable.
- **Staff** (current & alumni) = **compact cards** throughout, so players stay the
  visual hero.

So `RosterMemberCard` takes a `variant: 'hero' | 'compact'`. All fields null-safe
(F mappers/formatters).

---

## H3. Grouping, order, empties

- **Order:** oldest → newest by `joinedAt` within each block → founders surface first
  (legacy-narrative intent of "from the start").
- **Empty blocks** are omitted; if **Current** is empty but **Alumni** exists (defunct
  squad) → show Alumni alone. If the **whole** roster is empty → an OrgsGrid-style
  "add members in /admin" line.
- **Staff** block only when staff exist.

---

## H4. Edge cases

1. **Player → became coach at same org:** `roleAtOrg` is single (current-else-latest) →
   classified once (under Staff if now coach). Their playing era still shows in their
   stints/tenure range. Acceptable; not double-listed.
2. **No avatar** → `Initial` (accent-tinted), as `RosterGrid`.
3. **Honour-map miss** → no trophy badge (silent).
4. **Multi-spell** (rejoin) → `formatStints` renders "·"-joined ranges; `isCurrent` if
   any spell open.
5. **Alumnus who is still an active *Member*** elsewhere (e.g. MortaL: SouL alumni, S8UL
   current) → on SouL's page he's Alumni (his SouL tenure is closed) with a live link to
   his profile. Correct.

---

## H5. Deltas & wiring

- New: `src/components/site/LegacyRoster.tsx` (+ internal `RosterMemberCard`, or a
  sibling file).
- Consumes E4 (`groupRoster`, `memberHonourMap`), F (`formatStints`, `ROLE_LABELS`,
  `asTeam`, `resolveMany`).
- Mounted by G between the lead and `OrgHonours`; `id="roster"` for sub-nav.
- `OrgsGrid` cards get wrapped in `<Link href={'/orgs/'+slug}>` (Step 1.4) so the legacy
  pages are reachable — done here or in G's wiring step.
- Honour **count vs chip** styling shared with the player-page honours split (I/profile),
  so define the trophy-badge markup once (small shared snippet or `ui` helper).

---

## H-decisions — LOCKED

- **D-H1** ✅ Two tiers: Current players = hero image cards; Alumni = compact cards.
  Staff = compact throughout. `RosterMemberCard variant: 'hero' | 'compact'`.
- **D-H2** ✅ Alumni as a compact **card grid** (not a timeline rail).
