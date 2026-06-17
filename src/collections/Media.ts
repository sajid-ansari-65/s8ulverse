import type { CollectionConfig } from 'payload'
import { publicRead, contributorUp, editorUp } from '@/lib/access'

// Uploads: org logos/banners, player avatars/banners, game art.
// Replaces the planned Vercel Blob wiring — Payload gives uploads for free.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Admin',
  },
  access: {
    read: publicRead,
    create: contributorUp,
    update: contributorUp,
    delete: editorUp,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  // Restrict uploads to images (P7) — blocks non-image file types. A byte-size
  // cap is a server/Next body-limit concern (deploy-time), not an upload option.
  upload: {
    mimeTypes: ['image/*'],
  },
}
