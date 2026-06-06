import type { CollectionConfig } from 'payload'

// The people behind the S8UL family — rendered as the homepage founders strip.
export const Founders: CollectionConfig = {
  slug: 'founders',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'alias', 'role'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'order',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'alias', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', admin: { description: 'Lower = shown first.' } },
  ],
}
