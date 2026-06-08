import type { Access, CollectionBeforeChangeHook } from 'payload'

// ---------------------------------------------------------------------------
// 4-tier RBAC for S8ULverse.
//
// Until now every collection set only `read: () => true` and left create/update/
// delete at Payload's default (ANY authenticated user) — so any account could
// edit anything, and `Users` had no access block at all, letting a user flip
// their own `role` to owner. These helpers close that hole.
//
//   owner       — full control, incl. user management + granting admin/owner
//   admin       — all content + manage editor/contributor accounts
//   editor      — all content + site text (globals)
//   contributor — data entry only: members, achievements, brands, tenures, media
//
// Reads stay public (the site is public). Writes require a role at or above the
// listed tier. `req.user` carries the full account doc (role included), so no
// extra query is needed.
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'admin' | 'editor' | 'contributor'

const RANK: Record<Role, number> = { owner: 4, admin: 3, editor: 2, contributor: 1 }

// Tolerant of the not-yet-regenerated User type — we only ever read `role`/`id`.
type Actor = { id?: string | number; role?: Role | null } | null | undefined

const rankOf = (user: Actor): number => (user?.role ? (RANK[user.role] ?? 0) : 0)

/** True when the signed-in user's role is at least `min`. */
export const isAtLeast = (user: Actor, min: Role): boolean => rankOf(user) >= RANK[min]

const atLeast =
  (min: Role): Access =>
  ({ req: { user } }) =>
    rankOf(user as Actor) >= RANK[min]

export const adminUp: Access = atLeast('admin') // owner + admin
export const editorUp: Access = atLeast('editor') // owner + admin + editor
export const contributorUp: Access = atLeast('contributor') // any roled account

/** Public read — named so intent is obvious at each call site. */
export const publicRead: Access = () => true

// ---------------------------------------------------------------------------
// Privilege-escalation guard for the Users collection.
//   • only an owner may create/modify an account whose role is admin or owner
//   • nobody may change their OWN role (blocks self-escalation outright)
// Runs as a beforeChange hook so it covers create + update via REST, GraphQL,
// and the admin UI alike. Local-API seeds bypass access/hooks by default.
// ---------------------------------------------------------------------------
export const guardUserRole: CollectionBeforeChangeHook = ({ data, req, originalDoc, operation }) => {
  const actor = req.user as Actor
  const nextRole = data?.role as Role | undefined
  const prevRole = originalDoc?.role as Role | undefined

  const grantsPrivileged = nextRole === 'owner' || nextRole === 'admin'
  if (grantsPrivileged && actor?.role !== 'owner') {
    throw new Error('Only an owner can grant the admin or owner role.')
  }

  const editingSelf =
    operation === 'update' && actor?.id != null && actor.id === originalDoc?.id
  if (editingSelf && nextRole && nextRole !== prevRole) {
    throw new Error('You cannot change your own role.')
  }

  return data
}
