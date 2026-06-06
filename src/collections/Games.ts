import type { CollectionConfig } from 'payload'

// Maps Prisma `Game` (BGMI, Valorant, CoD-M, …).
export const Games: CollectionConfig = {
  slug: 'games',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'slug'],
  },
  access: {
    read: () => true,
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
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bgImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
