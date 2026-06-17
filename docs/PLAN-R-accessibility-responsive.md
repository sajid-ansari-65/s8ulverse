# Deep-dive R — Accessibility & responsive

Status: **DESIGN LOCKED** (review paper-item — [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-R1** reduced-motion in the motion primitives · **D-R2** ProfileTabs → full
ARIA tabs widget. (Both also fix pre-existing baseline gaps.)
A11y + responsive standards for the new components (LegacyRoster, OrgHonours,
BrandGrid/BrandsClient, org sub-nav, player Tenure/Brands tabs + honours), grounded in
existing patterns — and fixing two baseline gaps the new work would inherit.

---

## R0. Baseline (verified)

- ✅ Decorative elements use `aria-hidden` (glows, ghost text); icon-only buttons use
  `aria-label` (Nav toggle `aria-expanded`, YouTube scroll buttons). Images use real
  `alt` (RosterGrid `alt={m.ign}`).
- ⚠ **Reduced-motion respected ONLY in `Intro.tsx`** — `Reveal`, `TiltCard`, `CountUp`,
  `ProfileTabs`/`AnimatePresence` **ignore** `prefers-reduced-motion`.
- ⚠ **`ProfileTabs`** uses `<button>`s with **`outline-none`** (kills focus visibility)
  and is **not a semantic tabs widget** (no `role=tab/tablist/tabpanel`, `aria-selected`,
  arrow-key nav).

---

## R1. Findings

- **A11Y-1 (pre-existing, J amplifies) — ProfileTabs:** `outline-none` → **keyboard focus
  invisible**; no ARIA tab semantics. J adds Tenure + Brands tabs → the gap grows.
- **A11Y-2 (pre-existing, M amplifies) — reduced-motion:** 40+ alumni cards + trophy
  cabinet + tilts will animate for users who asked for less motion (only Intro opts out).
- **A11Y-3 — emoji-only meaning:** placement/trophy 🏆🥈 and status icons must not carry
  meaning alone → pair with `PLACEMENT_LABELS`/`BRAND_STATUS_LABELS` text + `aria-hidden`
  on the emoji.
- **A11Y-4 — new interactive surfaces** (build accessible from day one, don't repeat A11Y-1):
  - **BrandsClient filter** — real `<button>`s, `aria-pressed` on the active org/status
    chip, group `role="group" aria-label="Filter partnerships"`, visible `:focus-visible`.
  - **Org sticky sub-nav** — `<nav aria-label="On this page">` with real `<a href="#roster">`
    anchors (keyboard + SR friendly), `aria-current` on the in-view section (scroll-spy).
- **A11Y-5 — color/tint-only state:** "Former member" muted tint and brand "Past" muted
  card already carry **text** badges (Former / Past) → keep that; never tint-only.

---

## R2. Standards the new components must meet (checklist)

- **Links/cards:** each `RosterMemberCard` / brand card / trophy card is **one link with
  an accessible name** (IGN / brand / trophy title); avatars `alt` = person name;
  decorative gradients `aria-hidden`.
- **Headings:** sections use real heading levels (org page `h1` → section `h2` →
  card `h3`) so SR users can navigate by heading; sub-nav targets have matching ids.
- **Focus:** every interactive element has a **visible `:focus-visible` ring**; no bare
  `outline-none`.
- **Contrast:** `text-faint`/`text-bone-dim` on dark must meet **4.5:1** for text (check
  the mono labels at 10–11px — small text needs the higher-contrast token, not `faint`).
- **Touch targets:** filter chips / sub-nav links ≥ 40px tap height on mobile.

---

## R3. Reduced-motion (D-R1)

- **Respect it in the motion primitives** (`Reveal`, `TiltCard`, `CountUp`) via
  `useReducedMotion()` from `motion/react` → render final state immediately / disable tilt
  **[recommended — fixes the baseline AND every new card at once]**.
- vs **only gate the new components** (new Reveals check reduced-motion; leave existing
  primitives as-is) — smaller change, but leaves the existing site non-compliant.

---

## R4. Responsive

- **LegacyRoster:** hero (current) grid `1 / 2 / 4` cols (like RosterGrid); compact
  alumni/staff grid denser (`2 / 3 / 4`). **OrgHonours** cabinet `1 / 2 / 3`.
  **BrandGrid** `1 / 2 / 3`, featured spans wide on `lg`.
- **Org sub-nav:** horizontal, **scrollable on mobile** (don't wrap to stacked); sticky
  with a safe top offset under the fixed Nav.
- **ProfileTabs overflow (J):** with up to 6 tabs the bar wraps to 2 rows on mobile —
  acceptable, but verify it doesn't look broken; consider horizontal scroll if ugly.
- **Org header:** mirrors the responsive player header (already fluid).

---

## R5. Deltas

- **Fix-now (small, pre-existing):** ProfileTabs `outline-none` → `focus-visible` ring
  (A11Y-1); reduced-motion in primitives per D-R1 (A11Y-2).
- **In each new component:** the R2 checklist + R4 responsive cols + A11Y-3/4 specifics.
- Files: `ProfileTabs.tsx`, `motion/Reveal.tsx`+`TiltCard.tsx`+`CountUp.tsx` (D-R1),
  and all new `site/*` components built to the checklist.
- **Verify:** keyboard-only walk of an org page + player page (tab order, visible focus,
  sub-nav anchors); a screen-reader spot-check of a roster card + trophy; toggle OS
  reduced-motion; mobile widths 360/768/1024.

---

## R-decisions — LOCKED

- **D-R1** ✅ Respect reduced-motion **in the motion primitives** (`Reveal`/`TiltCard`/
  `CountUp` via `useReducedMotion()`) — fixes the baseline + all new cards at once.
- **D-R2** ✅ Upgrade **ProfileTabs to a full ARIA tabs widget** (role tablist/tab/
  tabpanel, `aria-selected`, arrow-key nav, visible focus ring).
