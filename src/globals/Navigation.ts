import type { GlobalConfig } from 'payload'
import { publicRead, editorUp } from '@/lib/access'

// Header + footer menus, editable from /admin → Globals → Navigation.
// The public Nav/Footer fall back to sensible defaults when this is empty,
// so the site is never link-less even before it's filled in.
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: 'Settings',
    description: 'Header + footer menus and social links.',
  },
  access: {
    read: publicRead,
    update: editorUp,
  },
  fields: [
    {
      name: 'header',
      type: 'array',
      label: 'Header menu',
      admin: { description: 'Top-bar links, left to right.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
            {
              name: 'href',
              type: 'text',
              required: true,
              admin: { width: '50%', description: 'e.g. /players or https://…' },
            },
          ],
        },
      ],
    },
    {
      name: 'footerColumns',
      type: 'array',
      label: 'Footer columns',
      admin: { description: 'Grouped link columns in the footer.' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'href', type: 'text', required: true, admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'social',
      type: 'array',
      label: 'Social links',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              admin: { width: '50%' },
              options: [
                'YouTube',
                'Instagram',
                'Twitter',
                'Twitch',
                'Facebook',
                'Discord',
                'TikTok',
                'Website',
              ],
            },
            { name: 'url', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'footerTagline',
      type: 'text',
      admin: { description: 'Small line in the footer baseline. Defaults to “Where legends live.”' },
    },
  ],
}
