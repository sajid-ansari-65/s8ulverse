import type { CollectionConfig } from 'payload'
import { publicRead, editorUp } from '@/lib/access'
import { cleanupTeamRefs } from '@/lib/integrity'

// Maps Prisma `Team` — an org's squad in a given game.
// Note: Prisma's @@unique([orgId, gameId]) is deferred (enforce via a hook in
// Phase B if needed); not expressible as a one-liner on relationship fields.
export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'org', 'game', 'isActive'],
  },
  access: {
    read: publicRead,
    create: editorUp,
    update: editorUp,
    delete: editorUp,
  },
  hooks: {
    // No DB cascade — null the optional `team` link on tenures/achievements/brands.
    afterDelete: [cleanupTeamRefs],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'org',
          type: 'relationship',
          relationTo: 'organizations',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'game',
          type: 'relationship',
          relationTo: 'games',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
