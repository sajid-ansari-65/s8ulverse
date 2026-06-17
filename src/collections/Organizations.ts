import type { CollectionConfig } from 'payload'
import { publicRead, editorUp } from '@/lib/access'
import { cleanupOrgRefs } from '@/lib/integrity'

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
    read: publicRead,
    create: editorUp,
    update: editorUp,
    delete: editorUp,
  },
  hooks: {
    // No DB cascade — delete dependent tenures/teams, scrub achievement/brand refs.
    afterDelete: [cleanupOrgRefs],
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
          admin: { width: '50%', description: 'Legacy single accent (fallback if no kit colours).' },
        },
        { name: 'isVerified', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
      ],
    },
    {
      // 2026/27 kit palette — drives the per-org theming across the public site
      // (--kit-primary / --kit-secondary / --kit-metal). Primary is the shared
      // family blue; metal is the org's heritage accent (SouL gold, 8Bit violet).
      type: 'collapsible',
      label: 'Kit colours (2026/27)',
      admin: {
        initCollapsed: true,
        description: 'Jersey-derived palette. Leave blank to fall back to the legacy accent.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kitPrimary',
              type: 'text',
              defaultValue: '#1b6fff',
              admin: { width: '33%', description: 'Primary (electric blue)' },
            },
            {
              name: 'kitSecondary',
              type: 'text',
              defaultValue: '#f4f7ff',
              admin: { width: '33%', description: 'Secondary (kit white)' },
            },
            {
              name: 'kitMetal',
              type: 'text',
              defaultValue: '#d4af37',
              admin: { width: '33%', description: 'Heritage / metal accent' },
            },
          ],
        },
      ],
    },
    {
      // Read-only view of every stint at this org (virtual — no column). Lets an
      // editor see/manage the org's full roster history from its own screen.
      name: 'roster',
      type: 'join',
      collection: 'tenures',
      on: 'org',
      admin: { description: 'Everyone who has had a stint at this org (from Tenures).' },
    },
  ],
}
