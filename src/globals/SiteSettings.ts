import type { GlobalConfig } from 'payload'
import { publicRead, editorUp } from '@/lib/access'

// Brand identity used across the chrome (Nav wordmark, Intro curtain, Footer).
// Every field has a defaultValue so /admin opens pre-filled and the site never
// shows blanks even before it's saved.
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings', description: 'Brand name, wordmark, tagline and footer details.' },
  access: { read: publicRead, update: editorUp },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'S8ULverse', admin: { width: '50%' } },
        {
          name: 'wordmarkSuffix',
          type: 'text',
          defaultValue: 'VERSE',
          admin: { width: '50%', description: 'The accent word after the logo (e.g. “VERSE”).' },
        },
      ],
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'Where legends live.',
      admin: { description: 'Shown in the intro curtain and footer baseline.' },
    },
    {
      name: 'contactEmail',
      type: 'text',
      defaultValue: 'hello@idara.studio',
      admin: { description: 'Public contact for the Privacy page / data requests.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'location',
          type: 'text',
          defaultValue: 'Surat · India',
          admin: { width: '50%', description: 'Footer location line.' },
        },
        {
          name: 'copyrightName',
          type: 'text',
          defaultValue: 'S8ULverse',
          admin: { width: '50%', description: 'Name in the © line.' },
        },
      ],
    },
    {
      name: 'familyOrgs',
      type: 'array',
      label: 'Family organizations',
      admin: { description: 'The org names shown in the footer “universe of” strip.' },
      defaultValue: [
        { name: 'S8UL' },
        { name: 'SouL' },
        { name: '8Bit' },
        { name: '8Bit Creative' },
      ],
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true, description: 'Default metadata used across the site.' },
      fields: [
        {
          name: 'metaTitleDefault',
          type: 'text',
          defaultValue: 'S8ULverse — Where legends live',
          admin: { description: 'Home/default page title.' },
        },
        {
          name: 'metaTitleTemplate',
          type: 'text',
          defaultValue: '%s — S8ULverse',
          admin: { description: 'Title pattern for sub-pages. %s = the page title.' },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          defaultValue:
            'The cinematic home of the S8UL family — S8UL, Team SouL, 8Bit & 8Bit Creative. Player & creator profiles, rosters, honours and the road to EWC 2026.',
        },
        {
          name: 'keywords',
          type: 'array',
          admin: { description: 'Search keywords.' },
          defaultValue: [
            { value: 'S8UL' },
            { value: 'S8UL Esports' },
            { value: 'Team SouL' },
            { value: '8Bit' },
            { value: 'Indian esports' },
            { value: 'BGMI' },
            { value: 'Valorant' },
            { value: 'EWC 2026' },
            { value: 'S8ULverse' },
          ],
          fields: [{ name: 'value', type: 'text', required: true }],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'twitterHandle',
              type: 'text',
              defaultValue: '@S8ulEsports',
              admin: { width: '50%' },
            },
            {
              name: 'themeColor',
              type: 'text',
              defaultValue: '#08080b',
              admin: { width: '50%', description: 'Browser theme color (hex).' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Search schema (JSON-LD)',
      admin: { initCollapsed: true, description: 'Organization data emitted for search engines.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'schemaOrgName', type: 'text', defaultValue: 'S8UL', admin: { width: '50%' } },
            {
              name: 'schemaLocation',
              type: 'text',
              defaultValue: 'Mumbai, India',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'schemaAlternateNames',
          type: 'array',
          label: 'Alternate names',
          defaultValue: [{ value: 'Team SouL' }, { value: '8Bit' }, { value: '8Bit Creative' }],
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
  ],
}
