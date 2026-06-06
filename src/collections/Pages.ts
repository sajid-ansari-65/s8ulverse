import type { CollectionConfig } from 'payload'

import { pageBlocks } from '../blocks/pageBlocks'

// Slugs owned by real code routes — an admin Page can't shadow these (the static
// route wins, so the page would be unreachable). Block them at the source.
const RESERVED = ['players', 'orgs', 'ewc', 'achievements', 'about', 'admin', 'api']

// Free-form pages authored entirely from /admin (e.g. /privacy, /contact).
// Rendered by the public catch-all route `app/(frontend)/[slug]/page.tsx`.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'published'],
    description: 'Custom pages you can create without code. They live at /your-slug.',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL path, e.g. "privacy" → /privacy. Lowercase, no spaces.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'A slug is required.'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
          return 'Use lowercase letters, numbers and hyphens only.'
        if (RESERVED.includes(value))
          return `"${value}" is a reserved route — pick another slug.`
        return true
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Uncheck to hide the page from the site.' },
    },
    {
      type: 'collapsible',
      label: 'Page header',
      admin: { description: 'The cinematic hero at the top of the page.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'headerKicker',
              type: 'text',
              admin: { width: '50%', placeholder: 'Eyebrow line (optional)' },
            },
            {
              name: 'subtitle',
              type: 'text',
              admin: { width: '50%', description: 'Line under the page title.' },
            },
          ],
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Page sections',
      admin: {
        description: 'Build the page from sections — add, reorder and mix any of these blocks.',
      },
      blocks: pageBlocks,
    },
    // Deprecated: kept (hidden) so the column isn't dropped — avoids an
    // ambiguous drizzle rename prompt on dev schema push. Superseded by `layout`.
    { name: 'body', type: 'richText', admin: { hidden: true } },
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDesc', type: 'textarea' },
      ],
    },
  ],
}
