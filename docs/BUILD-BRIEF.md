# S8ULverse — Build Brief (Legacy Rosters & Brand Partners)

> **The one doc to open each session.** Distills 18 planning docs (A–R, all LOCKED) into
> a build driver. Open the full `PLAN-*.md` only when you need depth on a specific area.
> Planning FROZEN 2026-06-07. No code written yet — we start at Phase 0.

---

## What we're building (5 asks)
1. **Brand-engagement hub** — a partners/sponsors section.
2. **S8UL** brand management · **3. 8Bit-Creative** brand management.
4. **SouL** + **5. 8Bit legacy rosters** — every player day-one → now, with join/exit
   dates and the trophies they won.

In one line: turn the site from "current players" into "the whole story — every player,
every era, every trophy, every sponsor."

---

## Locked decisions (the spine)
- **Tenures = new collection** (member ↔ org stints: month+year dates, role, team,
  isFounding). NOT flat fields on Member — this is what makes multi-org careers work
  (MortaL founded SouL → now S8UL). `Member.org` stays "current org". Edited inline via
  Payload `join`.
- **Achievements extended** (org / members / team / game / type / placement). Display:
  team honours → org page (trophy-cabinet grid + winner avatars); individual → player page.
- **Brands = new collection.** iQOO = Title/Naming-rights → Team iQOOSouL. Nav label
  "Partners" → `/brands`.
- **4-tier RBAC** (owner / admin / editor / contributor) via `lib/access.ts` + escalation
  guard. `Users.role` was unused = the open security hole.
- **Seed → `createIfAbsent`** (non-destructive) so hand-enrichment survives reseeds.
  Replaces the old destructive member/team `reset`.
- **Delete-cleanup hooks** on Members + Orgs + Teams. New helpers: `lib/roster.ts`,
  `lib/labels.ts` (display-only).

---

## 3 🔴 security fixes (ship FIRST — live today, independent of the feature)
1. **JsonLd XSS** — `JSON.stringify` → `dangerouslySetInnerHTML` unescaped. Escape it.
2. **Unenforced RBAC / self-escalation** — any logged-in user can edit anything &
   promote themselves. Enforce per-collection access + escalation guard.
3. **RLS deny-by-default** — DB reachable; enable Row-Level Security.

---

## Build disciplines (LOCKED — apply to every phase)
- **Brand-agnostic:** ZERO hardcoded brand strings/colors. Copy via Payload globals
  (generic defaults), colors/fonts via theme tokens + per-org `accentHex`. Enables
  deploy-per-org reuse. (Full template-ization / `brand.config.ts` deferred until after ship.)
- **Security-first:** the 3 fixes above land before feature work.
- **Schema-first:** build collections thinnest-first so data entry (~40 members / ~70
  tenures = the dominant project cost) can start in parallel.
- **Don't run the old `seed.ts`** (old flat-Member model) — write the new `createIfAbsent`
  seed first.

---

## Build order
- **Phase 0 — Schema:** Tenures + Brands collections, Achievements/Members edits, RBAC
  role, Step 0.6 helpers/hooks.
- **Phase 1 —** org page `/orgs/[slug]` + LegacyRoster.
- **Phase 2 —** brands UI + member Tenure/Brands tabs.
- **Phase 3 —** nav / sitemap / copy.

---

## Data scope
- **v1 recommended = SouL legacy only** (data ✅ fully sourced from Liquipedia).
- Defer 8Bit legacy + full sponsor sweep to v2 (⚠ thinner data).
- 8Bit leadership confirmed: founder **8bit Thug (2018)**, current owner **Beg4Mercy (2022→)**.
- Scout = SouL **alumnus** (former tenures only, not current).
- Profiles are null-safe → ship before every avatar/social is filled.

---

## Current state & standing rules
- **DB:** freshly wiped 2026-06-07 (content = 0; Users + Media + globals preserved). Backup:
  `/tmp/s8ulverse-predrop-20260607-184045.sql`. Site renders empty until Phase 0 + reseed.
- **Dev server:** the **user** runs it manually — Claude does NOT start/restart it. Verify
  via `npm run type-check` (+ user runs `devsafe`).
- **Secrets:** never echo `YOUTUBE_API_KEY` / DB creds in output. (DB password surfaced in a
  terminal error 2026-06-07 — consider rotating.)
- **Build-time verifies (resolve while coding):** Payload `join` / `filterOptions` /
  hasMany `in` operator behaviors.

---

## Reference map (open on demand only)
- Master plan: `PLAN-brand-legacy.md` · Plain-English: `OVERVIEW-plain-english.md`
- Deep-dives `PLAN-A` … `PLAN-Q` (data sourcing = **M**, RBAC = **Q**, query opt = **O**,
  security = **P**). All LOCKED — changes go to a v2 backlog, not re-audits.
