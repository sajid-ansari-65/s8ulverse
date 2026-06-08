# Deep-dive F — Presentation helpers (mappers · formatters · labels)

Status: **DESIGN LOCKED** (agenda item F of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-F1** human role labels · **D-F2** inline collection options + display-only
`labels.ts` (no `Member.role` refactor; drift-guarded).
Scope clarified: **E** locked the view-type *shapes*. **F** is the thin layer that
turns those typed docs into render-ready values — the glue every Phase-1/2 component
(G–J) consumes. Locking F before the pages prevents each component re-implementing
date/label/narrowing logic.

---

## F0. Current state (verified)

- **Roles render raw:** `RosterGrid.tsx:47` → `{m.position ?? m.role}`, so a missing
  `position` shows the enum code (e.g. "PLAYER"). No role→label map exists.
- **No month+year formatter:** `format.ts` has `formatNumber` and `formatDate`
  (`en-IN`, day-precision). Tenures/brands need month+year + ranges.
- **Precedent for label maps:** `SocialPresence.tsx` has
  `PLATFORM: Record<string, { label; color }>` — F generalises this idea instead of
  scattering one map per component.
- **Narrowing today:** only `asOrg` + `mediaUrl` exist; new types need `asTeam`,
  `asGame`, `asMember`, and a hasMany resolver.

---

## F1. Resolve / narrow helpers (the "mappers")  → `src/lib/types.ts`

Single-ref guards (mirror `asOrg`):
```ts
export const asTeam   = (v: TeamDoc | string | null | undefined) => (v && typeof v === 'object' ? v : null)
export const asGame   = (v: GameDoc | string | null | undefined) => (v && typeof v === 'object' ? v : null)
export const asMember = (v: Member  | string | null | undefined) => (v && typeof v === 'object' ? v : null)
```
HasMany resolver — turns `(T|string)[] | null` into populated `T[]`, **dropping bare
id strings** (this is also what makes E5's dangling refs invisible — a deleted ref
comes back as an id and is filtered out here):
```ts
export const resolveMany = <T,>(v: (T | string)[] | null | undefined): T[] =>
  (v ?? []).filter((x): x is T => typeof x === 'object' && x !== null)
```
Used for `Achievement.members`, `Brand.orgs`, `Brand.members`.

---

## F2. Formatters  → `src/lib/format.ts`

```ts
formatMonthYear(iso): string            // "2019-03-01" → "Mar 2019"  (en-IN, month+year)
formatTenureRange(joinedAt, leftAt?): string
   // "Mar 2019 – Present"  |  "Mar 2019 – Aug 2021"
formatStints(stints: {joinedAt; leftAt?}[]): string
   // multi-spell: "2019–20 · 2022–present"  (rejoins; collapses to a single range if one)
formatBrandWindow(start?, end?): string | null
   // "Since 2023"  |  "2023 – 2024"  |  null (no dates)
```
- Month+year reads the stored timestamp's month/year (day pinned to 01 by the picker).
- All null-safe; a missing `joinedAt` should never happen (required) but guarded.
- Locale stays `en-IN` for parity with `formatDate`.

---

## F3. Display label maps  → `src/lib/labels.ts` (new) — **display-only (D-F2)**

Collection `options` stay **inline** in each collection (existing house style;
`Member.role` is **not** refactored). `labels.ts` holds only **frontend display
maps** + the staff-role constant:

```ts
export const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Player', CREATOR: 'Creator', COACH: 'Coach',
  ANALYST: 'Analyst', MANAGER: 'Manager', OWNER: 'Owner',
}
// likewise: PLACEMENT_LABELS, ACH_TYPE_LABELS, BRAND_CATEGORY_LABELS, BRAND_STATUS_LABELS
export const STAFF_ROLES = ['COACH', 'ANALYST', 'MANAGER'] as const  // groupRoster (E4)
```
- **`Tenures.ts` defines its own inline `role` options** (same 6 values incl. Manager),
  duplicating `Member.role`'s value set by hand.
- **Accepted trade-off + guard:** because the two role enums are maintained separately,
  add a tiny **dev-only assertion / unit test** that every `Tenure.role` & `Member.role`
  option value has a key in `ROLE_LABELS` (and vice-versa) — catches drift without the
  refactor. `STAFF_ROLES` values must also exist in `ROLE_LABELS`.
- Components import the `*_LABELS` maps for display; fall back to the raw value if a key
  is missing (`ROLE_LABELS[r] ?? r`).

---

## F4. Role display (D-F1) — **human labels**

Roles render as human labels via `ROLE_LABELS` ("Player", "Coach"), with `position`
still winning when present: `m.position ?? ROLE_LABELS[m.role] ?? m.role`. Applied on
the new surfaces **and** to the existing `RosterGrid.tsx:47` so the whole roster reads
consistently (replaces the current raw `m.role`).

---

## F5. Where it lives & who consumes it

- `types.ts` += single-ref guards + `resolveMany` (F1).
- `format.ts` += the four date helpers (F2).
- **new** `labels.ts` (F3) — imported by collections **and** components.
- **new** `roster.ts` (from E4) imports `STAFF_ROLES` from `labels.ts`.
- Consumers: H (LegacyRoster — tenure ranges, role labels, founding/former badges),
  I (OrgHonours/Brands — placement/category labels, brand windows), J (member tab —
  brand windows), G (org header — founded year via existing helpers).

No new runtime deps; all pure functions (unit-testable).

---

## F6. Edge cases

1. **Unpopulated ref** in a hasMany → `resolveMany` drops it (renders as fewer items,
   never a crash). Aligns with E5.
2. **Single-spell vs multi-spell:** `formatStints` collapses one row to a plain range;
   ≥2 rows → "·"-joined compact ranges, sorted by `joinedAt`.
3. **Open + closed overlap** (rare data error: an open stint plus a later closed one)
   → treat "any open" as current; `formatStints` still lists rows in order.
4. **Brand with only a start / only an end** → "Since 2023" / "Until 2024"; both null
   → return null (card omits the window line).
5. **Locale/timezone:** month+year derived from the stored date's UTC month to avoid
   an off-by-one at month boundaries (picker stores day 01, so safe).

---

## F7. Deltas to the master plan

- Master index: **F** = presentation helpers (not "folded into E"); E = type shapes,
  F = the helpers over them.
- **Phase 0** gains `src/lib/labels.ts` (display maps only); collection options stay
  inline; `Tenures.ts` carries its own inline `role` options; **no `Member.role`
  change, no migration**. Add the dev-only role-drift assertion (F3).
- **Step 0.5 / E** `roster.ts` depends on `labels.ts` (`STAFF_ROLES`).
- `format.ts` + `types.ts` extensions are additive.
- One existing-file touch: `RosterGrid.tsx:47` role rendering → `ROLE_LABELS` (F4).

---

## F-decisions — LOCKED

- **D-F1** ✅ Roles render as **human labels** (`ROLE_LABELS`), `position` first;
  existing `RosterGrid` updated to match.
- **D-F2** ✅ Collection `options` stay **inline** (no `Member.role` refactor);
  `labels.ts` is **display-only**; `Tenures.ts` duplicates the role values inline,
  guarded by a dev-only drift assertion against `ROLE_LABELS`.
