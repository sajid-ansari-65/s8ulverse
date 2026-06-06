<div align="center">

# S8ULverse

**A cinematic profile hub for the S8UL family** — players & creators of
**S8UL · Team SouL · 8Bit · 8Bit Creative**.

Curated, single-source-of-truth profiles. Not a community wiki, not live scores.

</div>

---

## Overview

S8ULverse is a fan-facing, "Netflix-profile-meets-ESPN-feature" site presenting
the rosters, bios, careers, socials and achievements of the four S8UL-family
orgs. Content is editorially curated through a built-in CMS; player profiles pull
**live YouTube** stats (subs / videos / Live · Featured · Recent) and embed
**admin-curated Instagram** posts.

> **Scope:** org-centric profiles only. Community-wide live scores and
> leaderboards are intentionally out of scope (a separate project).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router, React Server Components) |
| UI | **React 19**, **TypeScript** (strict), **Tailwind CSS 3** |
| CMS / Admin | **Payload CMS v3** (mounted inside the same Next.js app) |
| Database | **Supabase Postgres** (`@payloadcms/db-postgres`) |
| Animation | **Motion** (`motion/react`) |
| Integrations | **YouTube Data API v3** (optional), **Instagram embed.js** |

A single Next.js app serves both the public site and the admin via two route
groups: `(frontend)` (public) and `(payload)` (`/admin` + REST/GraphQL API).

## Getting started

**Requirements:** Node `>= 20.9`, a Supabase Postgres database.

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#    then fill in the values (see table below)

# 3. Run
npm run dev          # http://localhost:3000  (admin at /admin)

# 4. (optional) Seed the roster
npm run seed
```

On first visit to `/admin` you'll create the initial admin user.

### Environment variables

| Var | Required | Where to get it |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Supabase → **Connect** → *Session pooler* string (port 5432). Replace `[YOUR-PASSWORD]`. |
| `PAYLOAD_SECRET` | ✅ | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `http://localhost:3000` in dev; your domain in production |
| `YOUTUBE_API_KEY` | — | [Google Cloud Console](https://console.cloud.google.com) → enable *YouTube Data API v3* → API key. Leave blank to disable YouTube sections. |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (public site + `/admin` + API) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run seed` | Load the roster (idempotent — safe to re-run) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` from collections |
| `npm run lint` / `npm run type-check` | Lint / type-check |

## Project structure

```
src/
├── app/
│   ├── (frontend)/        # public site (own root layout, OG images, sitemap, robots)
│   │   ├── page.tsx       # lean landing
│   │   ├── players/       # full roster + /players/[slug] profiles
│   │   ├── orgs/ ewc/ achievements/ about/   # dedicated sections
│   │   └── [slug]/        # catch-all → admin-authored Pages
│   └── (payload)/         # Payload admin (/admin) + REST & GraphQL API
├── collections/           # Payload collections (Organizations, Teams, Members, Pages, …)
├── globals/               # Navigation (editable header/footer menus)
├── components/            # motion · seo · site sections · ui primitives
├── lib/                   # Payload Local-API client, data readers, YouTube, helpers
├── payload.config.ts
└── seed.ts
```

### Content model

**Collections:** `Organizations` · `Games` · `Teams` · **`Members`**
(players/creators/coaches/owners — profiles, socials, careers, content feeds, SEO) ·
`Matches` · `Achievements` · `Founders` · **`Pages`** (free-form pages you create
from the admin, served at `/your-slug`) · `Media` · `Users`.

**Globals:** `Navigation` — manage the header menu, footer columns and social
links without touching code.

## Deployment

Designed for **Vercel**. Before deploying:

- Switch `DATABASE_URL` to the Supabase **transaction pooler** (port 6543).
- Configure persistent **media storage** (local `/media` is ephemeral on Vercel).
- Set `NEXT_PUBLIC_SITE_URL` to the production domain.
- (Optional) Add a cron to refresh cached YouTube data.

## License

MIT © Mohammad Sajid Ansari
# s8ulverse
