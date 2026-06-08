import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Organizations } from './collections/Organizations'
import { Games } from './collections/Games'
import { Teams } from './collections/Teams'
import { Members } from './collections/Members'
import { Achievements } from './collections/Achievements'
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

export default buildConfig({
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
    withRevalidate(Matches),
    withRevalidate(Achievements),
    withRevalidate(Founders),
    withRevalidate(Pages),
    withRevalidate(Media),
    Users,
  ],
  globals: [SiteSettings, Navigation, Homepage, FeaturedEvent, PageIntros].map(
    withGlobalRevalidate,
  ),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Live schema push only in dev (over DIRECT_URL); production runs
    // `payload migrate` separately — the transaction pooler can't push.
    push: !isProd,
    pool: {
      connectionString,
      // Session pooler (dev/migrate) tolerates a larger pool on one process;
      // the transaction pooler (prod serverless) wants it small since every
      // Vercel function instance opens its own pool.
      max: useDirect ? 10 : 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
  sharp,
  plugins: [],
})
