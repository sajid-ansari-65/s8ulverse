import type { GlobalConfig } from 'payload'

// All editorial copy on the homepage: hero, stat labels, teaser headings, CTA.
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Settings', description: 'Hero, stat labels, section headings and CTA copy.' },
  access: { read: () => true },
  fields: [
    {
      type: 'collapsible',
      label: 'Hero',
      fields: [
        {
          name: 'heroEyebrow',
          type: 'text',
          defaultValue: 'S8UL · SOUL · 8BIT · 8BIT CREATIVE',
          admin: { description: 'Small line above the headline.' },
        },
        {
          name: 'heroHeadline',
          type: 'array',
          label: 'Headline words',
          admin: { description: 'One row per line of the big headline. Tick “accent” to gradient it.' },
          defaultValue: [
            { word: 'WHERE', accent: false },
            { word: 'LEGENDS', accent: true },
            { word: 'LIVE', accent: false },
          ],
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'word', type: 'text', required: true, admin: { width: '70%' } },
                { name: 'accent', type: 'checkbox', admin: { width: '30%' } },
              ],
            },
          ],
        },
        {
          name: 'heroGhostText',
          type: 'text',
          defaultValue: 'S8ULVERSE',
          admin: { description: 'Faint oversized watermark behind the hero.' },
        },
        {
          name: 'heroSubtitle',
          type: 'textarea',
          defaultValue:
            'The cinematic home of the S8UL family — every player, every creator, one universe.',
        },
        {
          type: 'row',
          fields: [
            { name: 'heroCtaLabel', type: 'text', defaultValue: 'Enter roster', admin: { width: '50%' } },
            { name: 'heroCtaHref', type: 'text', defaultValue: '#roster', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Stat labels',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'statMembersLabel', type: 'text', defaultValue: 'Players & creators', admin: { width: '50%' } },
            { name: 'statOrgsLabel', type: 'text', defaultValue: 'Organizations', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'statTitlesLabel', type: 'text', defaultValue: 'Titles', admin: { width: '50%' } },
            { name: 'statReachLabel', type: 'text', defaultValue: 'Combined reach', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Section headings',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'orgsKicker', type: 'text', defaultValue: 'The dynasties', admin: { width: '50%' } },
            { name: 'orgsTitle', type: 'text', defaultValue: 'Organizations', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'rosterKicker', type: 'text', defaultValue: 'The faces', admin: { width: '50%' } },
            { name: 'rosterTitle', type: 'text', defaultValue: 'Featured roster', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Closing CTA',
      admin: { initCollapsed: true },
      fields: [
        { name: 'ctaEyebrow', type: 'text', defaultValue: 'One family · four banners' },
        { name: 'ctaTitle', type: 'text', defaultValue: 'Explore the universe of S8UL' },
        {
          type: 'row',
          fields: [
            { name: 'ctaPrimaryLabel', type: 'text', defaultValue: 'Browse the roster →', admin: { width: '50%' } },
            { name: 'ctaPrimaryHref', type: 'text', defaultValue: '/players', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'ctaSecondaryLabel', type: 'text', defaultValue: 'The story', admin: { width: '50%' } },
            { name: 'ctaSecondaryHref', type: 'text', defaultValue: '/about', admin: { width: '50%' } },
          ],
        },
      ],
    },
  ],
}
