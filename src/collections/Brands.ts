import type { CollectionConfig } from 'payload'
import { publicRead, contributorUp, editorUp } from '@/lib/access'

// Brand / sponsor partnerships — the data behind the Partners hub and each org's
// "Brand partnerships" section. One record per brand (a return = edit status +
// dates, or a second record); the deal window lives on the record itself.
//
// Naming-rights note: the SouL BGMI squad's `Team.name` is already "Team
// iQOOSouL" (sponsor baked into the competitive name). Brands captures the
// who/why of that relationship; we do NOT auto-rename teams from brand records.
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Brand', plural: 'Brands' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'category', 'status', 'featured'],
    description: 'Sponsors and brand partners shown on the Partners hub and org pages.',
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
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '60%', description: 'Brand/company — e.g. iQOO, AMD, Monster Energy.' },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { width: '40%' },
        },
      ],
    },
    { name: 'logo', type: 'upload', relationTo: 'media', admin: { description: 'Brand mark.' } },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          defaultValue: 'SPONSOR',
          admin: { width: '50%' },
          options: [
            { label: 'Title / Naming Rights', value: 'TITLE' },
            { label: 'Sponsor', value: 'SPONSOR' },
            { label: 'Ambassador', value: 'AMBASSADOR' },
            { label: 'Collaboration', value: 'COLLABORATION' },
            { label: 'Merch', value: 'MERCH' },
            { label: 'Campaign', value: 'CAMPAIGN' },
            { label: 'Event', value: 'EVENT' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'ACTIVE',
          index: true,
          admin: { width: '50%' },
          options: [
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Past', value: 'PAST' },
          ],
        },
      ],
    },
    {
      name: 'orgs',
      type: 'relationship',
      relationTo: 'organizations',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'Which family org(s) this deal involves (at least one).' },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      admin: { description: 'Players/creators/owners doing the brand work (optional).' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'team',
          type: 'relationship',
          relationTo: 'teams',
          index: true,
          admin: {
            width: '50%',
            description: 'Scope to a squad — e.g. the squad a Title brand names (iQOO → Team iQOOSouL).',
          },
          filterOptions: ({ siblingData }) => {
            const orgs = (siblingData as { orgs?: unknown })?.orgs
            return Array.isArray(orgs) && orgs.length ? { org: { in: orgs } } : true
          },
        },
        {
          name: 'game',
          type: 'relationship',
          relationTo: 'games',
          index: true,
          admin: { width: '50%', description: 'Scope to a discipline when there’s no single team.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            width: '50%',
            description: 'Deal start.',
            date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            width: '50%',
            description: 'Deal end — blank if ongoing.',
            date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
          },
        },
      ],
    },
    { name: 'description', type: 'textarea', admin: { description: 'The partnership in a line or two.' } },
    {
      type: 'row',
      fields: [
        { name: 'url', type: 'text', admin: { width: '70%', placeholder: 'https://…' } },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '30%', description: 'Highlight on the hub (wide card).' },
        },
      ],
    },
    {
      name: 'sortKey',
      type: 'number',
      index: true,
      admin: { description: 'Higher = shown first.' },
    },
  ],
}
