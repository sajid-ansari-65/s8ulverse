import type { MetadataRoute } from 'next'

import { getAllMemberSlugs, getAllOrgSlugs, getAllPageSlugs } from '@/lib/data'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const STATIC_PATHS = ['/', '/players', '/orgs', '/ewc', '/achievements', '/about']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [memberSlugs, orgSlugs, pageSlugs] = await Promise.all([
    getAllMemberSlugs(),
    getAllOrgSlugs(),
    getAllPageSlugs(),
  ])
  const now = new Date()

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${base}${path === '/' ? '' : path}`,
      lastModified: now,
      priority: path === '/' ? 1 : 0.8,
    })),
    ...orgSlugs.map((slug) => ({
      url: `${base}/orgs/${slug}`,
      lastModified: now,
      priority: 0.7,
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
