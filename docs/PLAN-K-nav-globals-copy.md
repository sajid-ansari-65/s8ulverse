# Deep-dive K — Nav, globals & editable copy

Status: **DESIGN LOCKED** (agenda item K of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-K1** nav label "Partners" → /brands · **D-K2** org-detail labels editable via
a Page-Intros `orgDetail` group.
Wires the new surfaces into navigation + keeps all new copy admin-editable
([[feedback-fully-editable-from-admin]]). Small but must honour the "no hardcoded copy"
bar.

---

## K0. Current state (verified)

- **Navigation** global = `header[]` ({label, href}), `footerColumns[]`, `social[]`,
  `footerTagline`; the `getNavigation` reader supplies **fallback defaults** when empty
  (`/players`, `/orgs`, etc.) so the site is never link-less.
- **Page Intros** global = per-page groups via an `intro(kicker,title,subtitle)` helper:
  `players`, `orgs`, `ewc`, `achievements`, `founders`, `about`. Each wired into that
  page's `PageHero`.
- Org **detail** pages are reached from the `/orgs` grid (no nav entry needed); only the
  **/brands hub** needs a nav link.

---

## K1. Navigation — add the hub link

- **Header:** add one entry → `{ label: <D-K1>, href: '/brands' }`. Add it to **both**
  (a) the seed's Navigation header array **and** (b) the `getNavigation` **fallback
  defaults** (so it shows even before the global is filled).
- **Footer:** add a "/brands" link to a footer column (e.g. under an "Explore" column),
  seed + fallback.
- Org detail pages: **no** nav entry (grid-reached).
- **Reserve `brands` (cross-check flaw):** add `'brands'` to the **Pages slug
  reserved-route block** (`Pages.ts` validation, currently
  `players/orgs/ewc/achievements/about/admin/api`) so an admin Page can't shadow the
  `/brands` route. (`/orgs/[slug]` is nested under the already-reserved `orgs`, so no
  extra reservation needed there.)

---

## K2. Page Intros — `brands` group (+ optional `orgDetail`)

- **`brands` group** — `intro('Brand engagement', 'Partners', '…')` defaults; wire into
  the `/brands` hub `PageHero` (same pattern as every index page). Clear-cut.
- **`orgDetail` group (D-K2)** — for the org detail page's **lead kicker + section
  labels** (Roster / Honours / Partnerships sub-nav). Two options:
  - make them editable via a small `orgDetail` intro group (honours the fully-editable
    bar), or
  - keep them as **sensible constants** (structural labels, not marketing copy).
- The org **header** itself (name, description, founded, accent, logo, social links) is
  **already** admin-editable on the Organizations record — no globals needed there.

---

## K3. Editable-copy audit (the fully-editable bar)

| New copy | Source |
|---|---|
| `/brands` hub kicker/title/subtitle | Page Intros `brands` (K2) |
| Org detail header (name, desc, founded, socials) | Organizations record (already editable) |
| Org detail section labels (Roster/Honours/Partnerships) | **D-K2** — `orgDetail` group **or** constants |
| Brand cards (name, category, description, dates) | Brands records |
| Roster cards (IGN, role, tenure, note) | Members + Tenures records |
| Honour cards (title, placement, year) | Achievements records |
| Empty-state lines ("add … in /admin") | constants (admin-facing, fine) |

→ With K2 done, **no user-facing marketing copy is hardcoded**; only structural labels
(and only if D-K2 = constants) and admin-facing empty states remain literal.

---

## K4. Seed & deltas

- **`globals/Navigation.ts`** — unchanged shape; the **link is data**, added via seed +
  reader fallback (no field change).
- **`globals/PageIntros.ts`** — add the `brands` group (+ `orgDetail` if D-K2).
- **`lib/data.ts`** — `getNavigation` fallback gains the Brands header/footer link;
  `getPageIntros` returns the new `brands` (+ `orgDetail`) group (extend its type).
- **`src/seed.ts`** — add the Brands nav header + footer entries (idempotent global set).
- Consumers: `/brands` hub `PageHero` (K2); org detail page reads `orgDetail` labels if
  D-K2 = group.

---

## K5. Edge cases

1. **Admin clears the header** → fallback defaults (incl. Brands) still render.
2. **Brands hub empty** (no brand records yet) → the nav link still exists; the page
   shows its intro + an empty-state (BrandGrid message). Acceptable pre-content.
3. **Label drift** — if D-K2 = group and admin empties a section label → reader falls
   back to the default constant (same defaultValue pattern as other globals).

---

## K-decisions — LOCKED

- **D-K1** ✅ Hub nav label = **"Partners"** (header + footer → `/brands`).
- **D-K2** ✅ Org-detail lead kicker + section labels (Roster/Honours/Partnerships)
  **editable** via a new Page-Intros `orgDetail` group (defaults via reader fallback).
