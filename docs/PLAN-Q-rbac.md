# Deep-dive Q — User roles & RBAC

Status: **DESIGN LOCKED** (added on request — [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-Q1** 4 tiers (owner/admin/editor/**contributor**) · **D-Q2** simple
role-write mapping (no draft gate).
Multiple user roles + role-based access. Also **closes the access-control gap** from the
security review (P2) — currently a real hole.

---

## Q0. Current state (verified — and it's broken)

- `Users` has a **`role` select** (`owner`/`admin`/`editor`, `defaultValue: 'editor'`) —
  but **nothing reads it**. Every collection sets only `read: () => true` and uses
  Payload's **default write = any authenticated user** → **every logged-in user can edit
  every collection + global.** The role field is decorative.
- **🔴 Privilege escalation:** no field-level access on `role` → a user can **set their
  own role to `owner`**. New users default to `editor` (write access) on signup.
- Globals have no access override → any authenticated user edits Site Settings/Nav/etc.

→ RBAC must be **implemented**, not just configured; and the escalation hole closed.

---

## Q1. Role model (D-Q1)

Keep a **single `role` per user** (simpler than multi-role for a curated hub). Tiers
(most→least privilege); add **`contributor`** below editor:

| Role | Intent |
|---|---|
| **owner** | full control incl. Users, destructive settings, deploy-sensitive |
| **admin** | manage all content + globals + users (not owner-only actions) |
| **editor** | manage all content collections + globals (copy); **no Users** |
| **contributor** | manage **roster content only** (Members, Tenures, Achievements, Brands, Media) — **no** Orgs/Games/Teams/Pages/Globals/Users |

> **`contributor` directly serves M:** the ~40-profile data-entry can be delegated to a
> contributor account without exposing structure/settings.

`defaultValue` → **`contributor`** (least privilege), not `editor`.

---

## Q2. Access helpers  → `src/lib/access.ts` (new)

```ts
type Role = 'owner'|'admin'|'editor'|'contributor'
const RANK: Record<Role, number> = { owner:3, admin:2, editor:1, contributor:0 }
const atLeast = (min: Role) => ({ req }: { req: { user?: { role?: Role } } }) =>
  !!req.user && RANK[req.user.role ?? 'contributor'] >= RANK[min]

export const isOwner       = atLeast('owner')
export const isAdmin       = atLeast('admin')
export const isEditor      = atLeast('editor')
export const isContributor = atLeast('contributor')   // = any authed staff
export const isPublic      = () => true
export const isAdminOrSelf = ({ req, id }) =>          // Users read/update own row
  isAdmin({ req }) || req.user?.id === id
```
Pure, reused by every collection's `access` block — single source for the rules.

---

## Q3. Per-collection access matrix (RBAC + pressure-test #1)

| Collection | read | create / update | delete |
|---|---|---|---|
| **Members, Tenures, Achievements, Brands, Media** | public | `isContributor` | `isEditor` |
| **Organizations, Games, Teams** | public | `isEditor` | `isAdmin` |
| **Pages, Matches, Founders** | public | `isEditor` | `isEditor` |
| **Users** | `isAdminOrSelf` | create `isAdmin` · update `isAdminOrSelf`* | `isOwner` |
| **Globals** (Site Settings, Navigation, Homepage, Featured Event, Page Intros) | public read | `isEditor` (Site Settings → `isAdmin`) | — |

\* **Users.update is `isAdminOrSelf`** but the **`role` field itself is admin-only**
(Q4) — so self-edit can't escalate.

This also *is* the security pressure-test: **no collection keeps the default open write;
every write is role-gated; public reads stay `() => true`** (the site is public).

---

## Q4. Field-level access (escalation guard)

- **`Users.role`** → `access: { update: isAdmin, create: isAdmin }` so a contributor/
  editor **cannot change roles** (incl. their own). Closes the escalation hole.
- Other sensitive fields (none currently) follow the same pattern if added.

---

## Q5. Admin panel access

- `access.admin` (collection-level) defaults to the read/access rules → contributors
  see the collections they can touch; hide the rest with `admin.hidden: ({ user }) =>
  RANK[user.role] < n` for Orgs/Games/Users/Pages so a contributor's nav is clean.
- Everyone with a role can enter `/admin` (they all do content work); **anonymous can't**
  (Payload auth). Pair with **RLS (O7)** — RBAC guards the Payload layer, RLS guards the
  DB/PostgREST layer (defense in depth; both required).

---

## Q6. Bootstrap & seeding

- **First user** (created at `/admin` first visit) must be **`owner`** — either set
  manually on first login, or a `Users.hooks.beforeChange` that assigns `owner` when the
  user count is 0. (Avoid everyone-defaults-to-contributor leaving no admin.)
- Seed may create named staff accounts with explicit roles (optional; passwords not
  seeded — `createIfAbsent`, never touch existing).

---

## Q7. Draft / publish workflow (D-Q2)

Optional governance for the contributor tier:
- **Simple role-write mapping** (Q3 as-is) — contributors' saves go live immediately.
  Trusted-team model, least code **[simpler]**.
- **Draft + publish gate** — enable Payload **drafts/versions** on content collections;
  **contributors can save drafts only**, **editor+ publishes** (public reads filter
  `_status: published`). More control + an approval step for delegated data entry, but a
  real lift (versions config + read filters + admin UX).

---

## Q8. Ties to other dives

- **P2/P5 (security):** Q makes "read-public/write-auth" concrete and **role-scoped**, and
  fixes the escalation hole P flagged abstractly.
- **O7 (RLS):** complementary layer — keep both.
- **N (seed):** `createIfAbsent` users; first-user = owner (Q6).
- **Public readers (`data.ts`)** unaffected — reads stay public; only writes gate.

---

## Q9. Deltas

- **New:** `src/lib/access.ts`.
- **Edited:** `collections/Users.ts` (add `contributor`, default→contributor, `role`
  field access, `isAdminOrSelf`), **every collection's `access`** block (matrix Q3),
  **every global's `access`** (Q5), `payload.config.ts` (admin), optional drafts (D-Q2).
- **Verify:** log in as each role → confirm the matrix (contributor can't touch Orgs/
  Users/Globals; can't self-escalate). `npm run type-check`.

---

## Q-decisions — LOCKED

- **D-Q1** ✅ **4 tiers** — owner / admin / editor / **contributor** (contributor =
  roster content only, for delegated M data-entry). `defaultValue: contributor`.
- **D-Q2** ✅ **Simple role-write mapping** — writes go live immediately; role gating
  controls who-edits-what. No draft/publish workflow (Payload drafts not enabled).
