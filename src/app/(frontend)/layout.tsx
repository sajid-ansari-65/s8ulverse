import type { Metadata, Viewport } from 'next'
import { Anton, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import React from 'react'

import { Atmosphere } from '@/components/site/Atmosphere'
import { Intro } from '@/components/site/Intro'
import { ScrollProgress } from '@/components/site/ScrollProgress'
import { SiteNav } from '@/components/site/Nav'
import { SiteFooter } from '@/components/site/Footer'
import { getNavigation, getSiteSettings } from '@/lib/data'
import './globals.css'

// Broadcast-cinematic type system — Anton (condensed display), Hanken Grotesk
// (body), JetBrains Mono (broadcast/stat meta). Deliberately not Inter.
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' })
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken' })
const jbm = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbm' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// SEO defaults are read from the Site Settings global so they're editable in /admin.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  const { seo } = site
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.metaTitleDefault, template: seo.metaTitleTemplate },
    description: seo.metaDescription,
    applicationName: site.siteName,
    keywords: seo.keywords,
    authors: [{ name: site.siteName }],
    creator: site.siteName,
    publisher: site.siteName,
    category: 'Esports',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: site.siteName,
      title: seo.metaTitleDefault,
      description: seo.metaDescription,
      url: '/',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.metaTitleDefault,
      description: seo.metaDescription,
      creator: seo.twitterHandle,
      site: seo.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const site = await getSiteSettings()
  return { themeColor: site.seo.themeColor, colorScheme: 'dark' }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [nav, site] = await Promise.all([getNavigation(), getSiteSettings()])
  return (
    <html
      lang="en"
      className={`${anton.variable} ${hanken.variable} ${jbm.variable}`}
      // Ad-blockers / extensions inject attributes + <style> into <head> before
      // hydration; this stops their mutations tripping a hydration warning.
      suppressHydrationWarning
    >
      <body
        className="relative min-h-screen overflow-x-clip bg-ink font-sans text-bone antialiased selection:bg-accent selection:text-ink"
        suppressHydrationWarning
      >
        <Intro wordmark={site.wordmarkSuffix} tagline={site.tagline.replace(/\.$/, '')} />
        <Atmosphere />
        <ScrollProgress />
        <SiteNav links={nav.header} wordmark={site.wordmarkSuffix} />
        <main className="relative z-10">{children}</main>
        <SiteFooter nav={nav} site={site} />
        <SpeedInsights />
      </body>
    </html>
  )
}
