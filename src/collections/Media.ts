import type { CollectionConfig } from 'payload'

// Uploads: org logos/banners, player avatars/banners, game art.
// Replaces the planned Vercel Blob wiring — Payload gives uploads for free.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Admin',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
