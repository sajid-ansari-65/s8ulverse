import type { MetadataRoute } from 'next'

import { getSiteSettings } from '@/lib/data'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSiteSettings()
  return {
    name: site.seo.metaTitleDefault,
    short_name: site.siteName,
    description: site.seo.metaDescription,
    start_url: '/',
    display: 'standalone',
    background_color: site.seo.themeColor,
    theme_color: site.seo.themeColor,
    categories: ['sports', 'entertainment', 'games'],
    icons: [
      { src: '/icon.png', sizes: '256x256', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
