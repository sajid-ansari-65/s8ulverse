import type { CollectionConfig } from 'payload'
import { publicRead, contributorUp, editorUp } from '@/lib/access'

// Org milestones — rendered as the homepage timeline.
export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'year', 'category'],
  },
  access: {
    read: publicRead,
    create: contributorUp,
    update: contributorUp,
    delete: editorUp,
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
    // --- Structured links (all additive/optional so existing rows stay valid) ---
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'Team',
          admin: {
            width: '50%',
            description: 'Team trophy (shown on the org timeline) or an individual award (shown on the player).',
          },
          options: [
            { label: 'Team', value: 'Team' },
            { label: 'Individual', value: 'Individual' },
          ],
        },
        {
          name: 'placement',
          type: 'select',
          admin: { width: '50%', description: 'Result — leave blank for awards (e.g. Personality of the Year).' },
          options: [
            { label: 'Champion', value: 'CHAMPION' },
            { label: 'Runner-up', value: 'RUNNER_UP' },
            { label: 'Top 3', value: 'TOP_3' },
            { label: 'Qualified', value: 'QUALIFIED' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'org',
          type: 'relationship',
          relationTo: 'organizations',
          index: true,
          admin: { width: '50%', description: 'Which family org won it (optional).' },
        },
        {
          name: 'game',
          type: 'relationship',
          relationTo: 'games',
          admin: { width: '50%', description: 'BGMI / Valorant — blank for non-game awards.' },
        },
      ],
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      admin: { description: 'Precise squad, e.g. iQOOSouL BGMI (optional).' },
      filterOptions: ({ siblingData }) => {
        const org = (siblingData as { org?: unknown })?.org
        return org ? { org: { equals: org } } : true
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      admin: {
        description: 'Who earned it — the winning roster (Team) or one person (Individual). Empty for org milestones.',
      },
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
