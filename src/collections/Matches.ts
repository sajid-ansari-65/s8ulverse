import type { CollectionConfig } from 'payload'

// Fixtures for the EWC 2026 (and future events) schedule rail.
export const Matches: CollectionConfig = {
  slug: 'matches',
  admin: {
    useAsTitle: 'opponent',
    group: 'Content',
    defaultColumns: ['opponent', 'competition', 'status', 'startsAt'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'startsAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'opponent', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'UPCOMING',
          admin: { width: '50%' },
          options: [
            { label: 'Live', value: 'LIVE' },
            { label: 'Upcoming', value: 'UPCOMING' },
            { label: 'Completed', value: 'COMPLETED' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'competition', type: 'text', admin: { width: '50%', description: 'e.g. BGMI — Group Stage' } },
        { name: 'game', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'event', type: 'text', defaultValue: 'EWC 2026' },
    { name: 'startsAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    {
      type: 'row',
      fields: [
        { name: 'scoreS8ul', type: 'number', label: 'S8UL score', admin: { width: '50%' } },
        { name: 'scoreOpponent', type: 'number', label: 'Opponent score', admin: { width: '50%' } },
      ],
    },
  ],
}
