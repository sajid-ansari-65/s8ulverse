# Deep-dive B — Role enum / MANAGER

Status: **RESOLVED — VOID** (agenda item B of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Outcome: no migration needed. Kept as a file for traceability.

---

## B1. Why B existed

G1 (staff in the legacy roster) needs a **Manager** role. The existing
`Members.role` is a Payload `select`, which Postgres stores as a **native enum**
(`enum_members_role`). The original worry: adding `MANAGER` to that enum is **not** a
plain additive column change — it's `ALTER TYPE … ADD VALUE`, which:

- **cannot run inside a transaction block** (Postgres restriction), and
- is handled **inconsistently by drizzle `push`** (the dev auto-migrate path), so it
  can stall or wedge a schema sync.

That made "just add Manager" a potential migration hazard worth its own dive.

---

## B2. Why it's now void

Deep-dive **A** moved per-stint role onto the **new `Tenures` collection**
(`Tenure.role`). The legacy roster groups/labels staff by **`roleAtOrg`** (derived
from `Tenure.role`), **not** the top-level `Member.role`.

`Tenure.role` is a **brand-new enum created from scratch** with the full option set
**including `Manager`** — a fresh `CREATE TYPE`, no `ALTER TYPE ADD VALUE`. So:

- **The existing `Member.role` enum is never touched.** No risky migration.
- Manager exists exactly where the roster needs it (per stint), which is also more
  correct — a person's role can differ per org/era (player → manager).

→ G1 is satisfied with zero migration risk. **B requires no work.**

---

## B3. Residual / fallback (only if ever needed)

If we later decide the **top-level `Member.role`** must also offer `Manager` (e.g. a
member whose *current/primary* role is Manager), the safe path is:

1. Prefer letting `Member.role` stay as-is and reading current role from the open
   tenure (already how the roster works), **or**
2. If the enum value is truly required, add it via a **manual SQL migration**
   (`ALTER TYPE "enum_members_role" ADD VALUE 'MANAGER';`) run **outside** a
   transaction — not via `drizzle push`. Payload supports versioned migrations
   (`payload migrate:create`) for exactly this; run it as a one-off rather than the
   dev auto-push.

Neither is needed for the current plan. Documented so the hazard is known if scope
changes.

---

## B4. Delta to the master plan

- Master plan's earlier "add MANAGER to the Members role select" note is **removed**;
  Manager lives on `Tenure.role` (see [PLAN-A-tenure-model.md](./PLAN-A-tenure-model.md) §A6).
- No schema step for B. Agenda item B closed.
