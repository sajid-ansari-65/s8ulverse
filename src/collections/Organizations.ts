import type { CollectionConfig } from 'payload'

// Maps Prisma `Organization` (S8UL, SouL, 8Bit, 8Bit Creative).
export const Organizations: CollectionConfig = {
  slug: 'organizations',
  labels: { singular: 'Organization', plural: 'Organizations' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'slug', 'isVerified'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'shortName', type: 'text', admin: { width: '50%' } },
      ],
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
        { name: 'logo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
        { name: 'banner', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
      ],
    },
    { name: 'founded', type: 'number' },
    { name: 'description', type: 'textarea' },
    {
      type: 'collapsible',
      label: 'Links',
      admin: { initCollapsed: true },
      fields: [
        { name: 'website', type: 'text' },
        { name: 'twitter', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'accentHex',
          type: 'text',
          defaultValue: '#f59e0b',
          admin: { width: '50%', description: 'Hex accent used on the public profile.' },
        },
        { name: 'isVerified', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
      ],
    },
  ],
}
