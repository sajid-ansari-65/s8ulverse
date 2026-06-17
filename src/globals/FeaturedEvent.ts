import type { GlobalConfig } from 'payload'
import { publicRead, editorUp } from '@/lib/access'

// The "Featured Event" band (currently EWC 2026). Fixtures live in the Matches
// collection; this global controls the surrounding copy + countdown target.
export const FeaturedEvent: GlobalConfig = {
  slug: 'featured-event',
  label: 'Featured Event',
  admin: { group: 'Settings', description: 'The headline event band (countdown + copy).' },
  access: { read: publicRead, update: editorUp },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kicker', type: 'text', defaultValue: 'Road to Paris', admin: { width: '50%' } },
        { name: 'title', type: 'text', defaultValue: 'EWC 2026', admin: { width: '50%' } },
      ],
    },
    {
      name: 'eventName',
      type: 'text',
      defaultValue: 'Esports World Cup',
      admin: { description: 'Full event name shown on the card.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dateRangeLabel',
          type: 'text',
          defaultValue: 'JUL 6 — AUG 23',
          admin: { width: '34%', description: 'Index label (top-right).' },
        },
        { name: 'location', type: 'text', defaultValue: 'Paris, France', admin: { width: '33%' } },
        { name: 'prize', type: 'text', defaultValue: '$75M', admin: { width: '33%' } },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      defaultValue: '2026-07-06T00:00:00.000Z',
      admin: { description: 'Countdown target.', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'teamPrefix',
      type: 'text',
      defaultValue: 'S8UL',
      admin: { description: 'Prefix before each fixture opponent (e.g. “S8UL · …”).' },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'S8UL returns as one of 40 official club partners — competing across 8+ titles in Paris.',
    },
  ],
}
