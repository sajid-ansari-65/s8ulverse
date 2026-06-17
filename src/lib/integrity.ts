import type { CollectionAfterDeleteHook } from 'payload'

// Normalize a hasMany relationship value (depth:0 ids, or populated docs) to ids.
const toIds = (arr: unknown): Array<number | string> =>
  ((arr as unknown[]) ?? []).map((m) =>
    m && typeof m === 'object' ? (m as { id: number | string }).id : (m as number | string),
  )

// Payload has no DB-level cascade, so deleting a Member would otherwise leave
// orphaned Tenure rows and stale member ids inside the hasMany relationship
// lists on Achievements and Brands. This afterDelete hook prunes all three so
// rosters, trophy winner-avatars, and brand attributions never point at a ghost.
//
// Runs with `overrideAccess` — it's system cleanup, not a user action, and must
// succeed regardless of who triggered the delete. (Orgs/Teams are near-static;
// their cleanup is handled separately if/when needed.)
export const cleanupMemberRefs: CollectionAfterDeleteHook = async ({ id, req }) => {
  const { payload } = req

  // 1. Delete this member's tenures — a stint with no member is meaningless.
  await payload.delete({
    collection: 'tenures',
    where: { member: { equals: id } },
    overrideAccess: true,
    req,
  })

  // 2. Pull the id out of every Achievement.members / Brand.members hasMany list.
  for (const collection of ['achievements', 'brands'] as const) {
    const affected = await payload.find({
      collection,
      where: { members: { in: [id] } },
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      req,
    })

    for (const doc of affected.docs) {
      // depth:0 → members are numeric ids; normalize (in case of populated docs)
      // and drop the deleted member.
      const current = ((doc as { members?: unknown[] }).members ?? []) as Array<
        number | { id: number }
      >
      const members = current
        .map((m) => (typeof m === 'object' && m ? m.id : m))
        .filter((mid) => mid !== id)
      await payload.update({
        collection,
        id: doc.id,
        data: { members },
        overrideAccess: true,
        req,
      })
    }
  }
}

// Organization delete → org is REQUIRED on tenures + teams (delete those), an
// optional single on achievements (null it), and a hasMany on brands (pull it;
// if that would empty `orgs` — minRows 1 — the brand has no family org left, so
// delete it). Deleting teams here cascades into cleanupTeamRefs.
export const cleanupOrgRefs: CollectionAfterDeleteHook = async ({ id, req }) => {
  const { payload } = req

  await payload.delete({ collection: 'tenures', where: { org: { equals: id } }, overrideAccess: true, req })
  await payload.delete({ collection: 'teams', where: { org: { equals: id } }, overrideAccess: true, req })

  const achs = await payload.find({
    collection: 'achievements',
    where: { org: { equals: id } },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    req,
  })
  for (const d of achs.docs) {
    await payload.update({ collection: 'achievements', id: d.id, data: { org: null }, overrideAccess: true, req })
  }

  const brands = await payload.find({
    collection: 'brands',
    where: { orgs: { in: [id] } },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    req,
  })
  for (const b of brands.docs) {
    const remaining = toIds((b as { orgs?: unknown[] }).orgs).filter((x) => String(x) !== String(id))
    if (remaining.length === 0) {
      await payload.delete({ collection: 'brands', id: b.id, overrideAccess: true, req })
    } else {
      await payload.update({
        collection: 'brands',
        id: b.id,
        data: { orgs: remaining as number[] },
        overrideAccess: true,
        req,
      })
    }
  }
}

// Team delete → `team` is an optional single everywhere (tenures, achievements,
// brands), so just null the references; the rows themselves stay valid.
export const cleanupTeamRefs: CollectionAfterDeleteHook = async ({ id, req }) => {
  const { payload } = req
  for (const collection of ['tenures', 'achievements', 'brands'] as const) {
    const { docs } = await payload.find({
      collection,
      where: { team: { equals: id } },
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      req,
    })
    for (const d of docs) {
      await payload.update({ collection, id: d.id, data: { team: null }, overrideAccess: true, req })
    }
  }
}
