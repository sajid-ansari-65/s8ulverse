import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { publicRead, contributorUp, editorUp } from '@/lib/access'

// A member's affiliation history — one row per stint at a family org. Modelled
// as its own collection (not flat fields on Member) because affiliation is a
// HISTORY: members move between orgs (MortaL founded SouL, now S8UL), rejoin
// (Goblin, Jokerr), and "founding" is per-org. A flat `Member.org` can't hold
// any of that; tenures can, and queries stay trivial both ways
// (`tenures where org == X` for a roster, `where member == Y` for a timeline).
//
// Editors never have to open this collection directly: the Member screen hosts a
// `join` field that creates/edits a person's tenures inline (see Members.ts).

// U+2013 EN DASH for the year range — referenced by code point so this file
// stays pure ASCII.
const EN_DASH = String.fromCharCode(0x2013)

const yearOf = (iso: unknown): string =>
  typeof iso === 'string' && iso ? String(new Date(iso).getUTCFullYear()) : ''

// Build a readable title ("MortaL · Team SouL · 2018–present") so the admin list
// and relationship pickers are legible — tenures are otherwise anonymous rows.
const setTenureTitle: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data
  const { payload } = req
  const parts: string[] = []

  try {
    if (data.member) {
      const m = await payload.findByID({
        collection: 'members',
        id: data.member,
        depth: 0,
        req,
      })
      if (m?.ign) parts.push(m.ign)
    }
    if (data.org) {
      const o = await payload.findByID({
        collection: 'organizations',
        id: data.org,
        depth: 0,
        req,
      })
      if (o?.name) parts.push(o.name)
    }
  } catch {
    /* relationship not resolvable yet — fall through with what we have */
  }

  const start = yearOf(data.joinedAt)
  const end = data.leftAt ? yearOf(data.leftAt) : 'present'
  if (start) parts.push(`${start}${EN_DASH}${end}`)

  data.title = parts.join(' · ') || 'Tenure'
  return data
}

export const Tenures: CollectionConfig = {
  slug: 'tenures',
  labels: { singular: 'Tenure', plural: 'Tenures' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'member', 'org', 'role', 'joinedAt', 'leftAt'],
    description: 'A member’s time at one org. Usually edited from the Member screen.',
  },
  access: {
    read: publicRead,
    create: contributorUp,
    update: contributorUp,
    delete: editorUp,
  },
  defaultSort: 'joinedAt',
  hooks: {
    beforeChange: [setTenureTitle],
  },
  fields: [
    {
      // Auto-generated from member/org/dates; hidden from editors.
      name: 'title',
      type: 'text',
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'member',
          type: 'relationship',
          relationTo: 'members',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'org',
          type: 'relationship',
          relationTo: 'organizations',
          required: true,
          index: true,
          admin: { width: '50%', description: 'Which family org this stint was with.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          admin: { width: '50%', description: 'Role during THIS stint.' },
          options: [
            { label: 'Player', value: 'PLAYER' },
            { label: 'Creator', value: 'CREATOR' },
            { label: 'Coach', value: 'COACH' },
            { label: 'Analyst', value: 'ANALYST' },
            { label: 'Manager', value: 'MANAGER' },
            { label: 'Owner', value: 'OWNER' },
          ],
        },
        {
          name: 'team',
          type: 'relationship',
          relationTo: 'teams',
          index: true,
          admin: { width: '50%', description: 'Squad/game in that org (optional).' },
          // Only offer squads belonging to the org chosen above.
          filterOptions: ({ siblingData }) => {
            const org = (siblingData as { org?: unknown })?.org
            return org ? { org: { equals: org } } : true
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'joinedAt',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '50%',
            description: 'Entry.',
            date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
          },
        },
        {
          name: 'leftAt',
          type: 'date',
          admin: {
            width: '50%',
            description: 'Exit — leave blank if still current.',
            date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isFounding',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '50%', description: 'Founded THIS org (day-one).' },
        },
        {
          name: 'note',
          type: 'text',
          admin: { width: '50%', description: 'Context / fuzzy-date note (optional).' },
        },
      ],
    },
  ],
}
