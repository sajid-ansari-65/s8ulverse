import type { MetadataRoute } from 'next'

import { getAllMemberSlugs, getAllPageSlugs } from '@/lib/data'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// Real, routable URLs only. (Orgs have a listing page but no per-org detail
// route yet, so we don't emit /orgs/[slug].)
const STATIC_PATHS = ['/', '/players', '/orgs', '/ewc', '/achievements', '/about']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [memberSlugs, pageSlugs] = await Promise.all([getAllMemberSlugs(), getAllPageSlugs()])
  const now = new Date()

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${base}${path === '/' ? '' : path}`,
      lastModified: now,
      priority: path === '/' ? 1 : 0.8,
    })),
    ...memberSlugs.map((slug) => ({
      url: `${base}/players/${slug}`,
      lastModified: now,
      priority: 0.7,
    })),
    ...pageSlugs.map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: now,
      priority: 0.5,
    })),
  ]
}
