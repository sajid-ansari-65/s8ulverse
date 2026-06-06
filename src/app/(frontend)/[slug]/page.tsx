import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageBlocks } from '@/components/site/PageBlocks'
import { PageHero } from '@/components/site/PageHero'
import { Container } from '@/components/ui'
import { getAllPageSlugs, getPageBySlug } from '@/lib/data'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDesc ?? page.subtitle ?? undefined,
    alternates: { canonical: `/${page.slug}` },
  }
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  return (
    <>
      <PageHero
        kicker={page.headerKicker || 'S8ULverse'}
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        ghost={page.title.toUpperCase()}
      />
      {page.layout?.length ? (
        <div className="pb-32">
          <PageBlocks blocks={page.layout} />
        </div>
      ) : (
        <Container className="pb-32 pt-12">
          <p className="font-mono text-sm text-faint">This page has no sections yet.</p>
        </Container>
      )}
    </>
  )
}
