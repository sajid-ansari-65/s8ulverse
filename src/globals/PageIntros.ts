import type { GlobalConfig } from 'payload'

// Kicker / title / subtitle for the interior page headers, plus the About story.
// Each field carries its current copy as a defaultValue, with reader fallbacks.
const intro = (kicker: string, title: string, subtitle: string) => ({
  type: 'group' as const,
  fields: [
    {
      type: 'row' as const,
      fields: [
        { name: 'kicker', type: 'text' as const, defaultValue: kicker, admin: { width: '40%' } },
        { name: 'title', type: 'text' as const, defaultValue: title, admin: { width: '60%' } },
      ],
    },
    { name: 'subtitle', type: 'textarea' as const, defaultValue: subtitle },
  ],
})

export const PageIntros: GlobalConfig = {
  slug: 'page-intros',
  label: 'Page Intros',
  admin: { group: 'Settings', description: 'Headers for the Players / Orgs / EWC / Honours / About pages.' },
  access: { read: () => true },
  fields: [
    {
      name: 'players',
      ...intro(
        'The faces',
        'Roster',
        'Every player, creator, coach and owner across the S8UL family — one tap from their full profile.',
      ),
    },
    {
      name: 'orgs',
      ...intro(
        'The dynasties',
        'Organizations',
        'Four banners, one family — the orgs that shaped Indian esports.',
      ),
    },
    {
      name: 'ewc',
      // Title comes from Featured Event; only kicker + subtitle here.
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', defaultValue: 'The road ahead' },
        {
          name: 'subtitle',
          type: 'textarea',
          defaultValue:
            'The countdown and the campaign — every S8UL-family fixture on the way to esports’ biggest stage.',
        },
      ],
    },
    {
      name: 'achievements',
      ...intro(
        'The record',
        'Honours',
        'A decade of firsts — the trophies and milestones that built the dynasty.',
      ),
    },
    {
      name: 'founders',
      // Section heading for the founders strip (kicker + title only).
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'kicker', type: 'text', defaultValue: 'The architects', admin: { width: '50%' } },
            { name: 'title', type: 'text', defaultValue: 'Founders', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'about',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'kicker', type: 'text', defaultValue: 'The story', admin: { width: '40%' } },
            { name: 'title', type: 'text', defaultValue: 'About', admin: { width: '60%' } },
          ],
        },
        {
          name: 'subtitle',
          type: 'textarea',
          defaultValue: 'One family, four banners, a generation of Indian esports.',
        },
        {
          name: 'lead',
          type: 'textarea',
          label: 'Lead paragraph (large)',
          defaultValue:
            'S8ULverse is the cinematic home of the S8UL family — a single place to follow the players, creators and teams of S8UL, Team SouL, 8Bit and 8Bit Creative.',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Body paragraph',
          defaultValue:
            'From the early days of mobile esports to world stages, this is the roster, the record and the road ahead — curated, verified and built for the fans who made it a movement.',
        },
      ],
    },
  ],
}
