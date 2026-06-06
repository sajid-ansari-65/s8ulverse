import type { Block } from 'payload'

// Section blocks for the Pages layout builder. Each renders via a matching
// view in `src/components/site/PageBlocks.tsx`. Mirrors the cinematic sections
// used across the main site so custom pages feel native.

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [{ name: 'content', type: 'richText' }],
}

export const SectionBlock: Block = {
  slug: 'section',
  labels: { singular: 'Section (heading + text)', plural: 'Sections' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kicker', type: 'text', admin: { width: '40%', placeholder: 'The record' } },
        { name: 'heading', type: 'text', required: true, admin: { width: '60%' } },
      ],
    },
    { name: 'content', type: 'richText' },
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'Stat band', plural: 'Stat bands' },
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'number', required: true, admin: { width: '30%' } },
            { name: 'label', type: 'text', required: true, admin: { width: '55%' } },
            {
              name: 'compact',
              type: 'checkbox',
              label: 'K/M',
              admin: { width: '15%', description: 'Abbreviate big numbers.' },
            },
          ],
        },
      ],
    },
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'CTAs' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { placeholder: 'One family · four banners' } },
    { name: 'heading', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'primaryLabel', type: 'text', admin: { width: '50%' } },
        { name: 'primaryHref', type: 'text', admin: { width: '50%', placeholder: '/players' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'secondaryLabel', type: 'text', admin: { width: '50%' } },
        { name: 'secondaryHref', type: 'text', admin: { width: '50%', placeholder: '/about' } },
      ],
    },
  ],
}

export const RosterBlock: Block = {
  slug: 'roster',
  labels: { singular: 'Roster grid', plural: 'Roster grids' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kicker', type: 'text', admin: { width: '50%', placeholder: 'The faces' } },
        { name: 'heading', type: 'text', admin: { width: '50%', placeholder: 'Roster' } },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { label: 'Featured members', value: 'featured' },
        { label: 'All members', value: 'all' },
      ],
    },
  ],
}

export const FoundersBlock: Block = {
  slug: 'foundersBlock',
  labels: { singular: 'Founders strip', plural: 'Founders strips' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kicker', type: 'text', admin: { width: '50%', placeholder: 'The architects' } },
        { name: 'heading', type: 'text', admin: { width: '50%', placeholder: 'Founders' } },
      ],
    },
  ],
}

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      type: 'row',
      fields: [
        { name: 'caption', type: 'text', admin: { width: '70%' } },
        {
          name: 'fullBleed',
          type: 'checkbox',
          label: 'Full width',
          admin: { width: '30%' },
        },
      ],
    },
  ],
}

export const pageBlocks: Block[] = [
  RichTextBlock,
  SectionBlock,
  StatsBlock,
  CtaBlock,
  RosterBlock,
  FoundersBlock,
  MediaBlock,
]
