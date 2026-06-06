import type { CollectionConfig } from 'payload'

// Org milestones — rendered as the homepage timeline.
export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'year', 'category'],
  },
  access: {
    read: () => true,
  },
  defaultSort: '-sortKey',
  fields: [
    {
      name: 'title',
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
        { name: 'year', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'category',
          type: 'text',
          admin: { width: '50%', description: 'e.g. EWC, BGMI, Awards' },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'sortKey',
      type: 'number',
      index: true,
      admin: {
        description: 'Higher = shown first. Tip: use the year (e.g. 2026) plus a tiebreaker.',
      },
    },
  ],
}
