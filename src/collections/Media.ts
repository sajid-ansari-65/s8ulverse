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
  // Restrict uploads to images (P7) — blocks non-image file types. The byte-size
  // cap is enforced globally via config.upload.limits.fileSize (payload.config).
  upload: {
    mimeTypes: ['image/*'],
  },
}
