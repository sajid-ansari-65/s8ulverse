import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Organizations } from './collections/Organizations'
import { Games } from './collections/Games'
import { Teams } from './collections/Teams'
import { Members } from './collections/Members'
import { Tenures } from './collections/Tenures'
import { Achievements } from './collections/Achievements'
import { Brands } from './collections/Brands'
import { Founders } from './collections/Founders'
import { Matches } from './collections/Matches'
import { Pages } from './collections/Pages'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { Homepage } from './globals/Homepage'
import { FeaturedEvent } from './globals/FeaturedEvent'
import { PageIntros } from './globals/PageIntros'
import { withGlobalRevalidate, withRevalidate } from './lib/revalidate'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Supabase exposes two poolers with different strengths:
//   • DATABASE_URL → transaction pooler (6543): serverless-safe, used for plain
//     runtime queries in production (connections are returned per-transaction,
//     so many Vercel function instances can't exhaust the backend).
//   • DIRECT_URL   → session pooler (5432): required whenever Payload touches
//     the SCHEMA, because the transaction pooler can't hold the session-level
//     advisory locks that dev `push` and `payload migrate` depend on.
//
// So: dev (which live-pushes schema) and any `migrate` command use DIRECT_URL;
// production runtime uses DATABASE_URL. Each falls back to the other if unset,
// so a single-URL setup still works.
const isProd = process.env.NODE_ENV === 'production'
const isMigrating = process.argv.some((a) => a.includes('migrate'))
const useDirect = !isProd || isMigrating
const connectionString =
  (useDirect ? process.env.DIRECT_URL : process.env.DATABASE_URL) ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  ''

// Public origin — used to pin CORS/CSRF (so the auth-cookie API can't be driven
// from another origin) and as Payload's serverURL.
const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Origins allowed to make credentialed API calls. Always our canonical site;
// plus the deployment's own URL on Vercel (so the admin works on *.vercel.app
// preview builds, whose origin isn't NEXT_PUBLIC_SITE_URL); plus localhost in dev.
const allowedOrigins = [
  siteURL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  !isProd && 'http://localhost:3000',
].filter((o): o is string => Boolean(o))

// Auth tokens are signed with this; an empty secret means predictable tokens →
// auth bypass. Fail loudly in production rather than booting insecure.
const payloadSecret = process.env.PAYLOAD_SECRET || ''
if (isProd && !payloadSecret) {
  throw new Error(
    'PAYLOAD_SECRET is required in production. Set it in the environment (openssl rand -base64 32).',
  )
}

export default buildConfig({
  serverURL: siteURL,
  // Lock the REST/GraphQL API + auth cookies to known origins. Without this,
  // Payload's permissive defaults let another site issue credentialed requests
  // (CSRF / cookie-driven calls).
  cors: allowedOrigins,
  csrf: allowedOrigins,
  // GraphQL is public-read by design, but never expose the playground (schema
  // explorer / mutation console) on production.
  graphQL: {
    disablePlaygroundInProduction: true,
  },
  // Global upload ceiling — caps every file write so a (compromised) contributor
  // can't exhaust Blob storage/bandwidth with huge files. 5 MB covers logos,
  // avatars and banners comfortably.
  upload: {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — S8ULverse',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
      views: {
        // Replace Payload's default dashboard (a grid that just mirrors the
        // sidebar) with a real content overview — counts + recent activity.
        dashboard: { Component: '@/components/admin/Dashboard' },
      },
    },
  },
  // Content collections first; admin/media utilities last. Content collections
  // are wrapped so any save/delete purges the public cache (instant edits);
  // Users (auth) is excluded.
  collections: [
    withRevalidate(Organizations),
    withRevalidate(Games),
    withRevalidate(Teams),
    withRevalidate(Members),
    withRevalidate(Tenures),
    withRevalidate(Matches),
    withRevalidate(Achievements),
    withRevalidate(Brands),
    withRevalidate(Founders),
    withRevalidate(Pages),
    withRevalidate(Media),
    Users,
  ],
  globals: [SiteSettings, Navigation, Homepage, FeaturedEvent, PageIntros].map(
    withGlobalRevalidate,
  ),
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Live schema push only in dev (over DIRECT_URL); production runs
    // `payload migrate` separately — the transaction pooler can't push.
    push: !isProd,
    pool: {
      connectionString,
      // Supabase's SESSION pooler (dev/migrate, DIRECT_URL) caps total clients at
      // 15. Next's static-path generation spawns several worker PROCESSES, each
      // opening its OWN pool — so a big per-pool max multiplies fast and trips
      // EMAXCONNSESSION. Keep it small (3) so even ~4 workers stay under 15.
      // The transaction pooler (prod serverless) also wants it small since every
      // Vercel function instance opens its own pool.
      max: useDirect ? 3 : 5,
      // Release idle connections quickly so worker pools don't pile up.
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
  sharp,
  plugins: [
    // Media → Vercel Blob (local /media is ephemeral on Vercel serverless).
    // Token is wired into every Vercel env + pulled to .env.local for dev.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
