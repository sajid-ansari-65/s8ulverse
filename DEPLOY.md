# Deploying S8ULverse to Vercel

The app is Next.js 15 (App Router) with Payload CMS on Supabase Postgres.
Most of the "it's slow locally" pain is a **dev-mode artifact** (live DB query +
route compile on every request). In production, pages are static/ISR and visitors
hit the CDN, not the DB — so the deploy config below is mostly about **connection
strategy** and **region**, not raw speed.

---

## 1. Region — keep functions next to the DB

The Supabase project is in **`ap-south-1` (Mumbai)**. Vercel defaults to `iad1`
(US East), which would put an ocean between every query and the DB. So we pin
serverless functions to Mumbai:

- Committed in [`vercel.json`](./vercel.json): `"regions": ["bom1"]`
- Belt-and-suspenders, also set it in the dashboard:
  **Vercel → Project → Settings → Functions → Function Region → Mumbai (bom1)**

---

## 2. Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** and **Preview**:

| Var | Value | Used for |
|---|---|---|
| `DATABASE_URL` | Supabase **transaction pooler**, port **6543** | runtime queries (serverless-safe) |
| `DIRECT_URL` | Supabase **session pooler**, port **5432** | migrations / schema work |
| `PAYLOAD_SECRET` | (same secret as local) | Payload auth |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | absolute URLs, OG, JSON-LD |
| `YOUTUBE_API_KEY` | (restricted key) | channel stats / live band |

Get both pooler strings from **Supabase → Settings → Database → Connection
string**, toggling **Transaction** (6543) vs **Session** (5432) mode.

> Why two URLs: the transaction pooler is great for many short-lived serverless
> connections but **can't hold the session-level advisory locks** that schema
> push / `payload migrate` need. So runtime uses 6543, schema work uses 5432.
> This split is wired in [`src/payload.config.ts`](./src/payload.config.ts) —
> it auto-selects based on `NODE_ENV` + whether the command is a migration.

---

## 3. Connection strategy (already wired — for reference)

`src/payload.config.ts` picks the URL automatically:

| Context | Uses | Pooler | `push` |
|---|---|---|---|
| Local `npm run dev` | `DIRECT_URL` | 5432 session | on (live schema sync) |
| `payload migrate` (any env) | `DIRECT_URL` | 5432 session | — |
| Vercel build + runtime | `DATABASE_URL` | 6543 transaction | off |

Pool `max`: 10 on the session pooler (one dev process), 5 on the transaction
pooler (each Vercel function instance opens its own pool — keep it small).

---

## 4. Schema / migrations

**Important:** local dev and (currently) production share **one** Supabase
database. Dev `push` (over 5432) mutates that shared DB's schema directly, so for
the first deploy the schema is **already applied** — no migrate step needed.

When you later want versioned, controlled schema changes (or a separate
prod/staging DB):

```bash
npm run payload migrate:create   # snapshot current schema → SQL migration file (commit it)
npm run payload migrate          # apply pending migrations (runs over DIRECT_URL/5432)
```

`push` is off in production, so prod never auto-alters the schema — migrations are
the only path once you split databases.

---

## 5. Deploy

```bash
git add -A && git commit -m "…"      # repo isn't initialised yet: git init first
# push to GitHub, import the repo in Vercel (or `vercel --prod`)
```

Vercel auto-detects Next.js. Build runs `next build` (reads DB over 6543 to
prerender). After deploy, admin edits revalidate the public cache instantly via
the Payload `afterChange` hooks in `src/lib/revalidate.ts`.

---

## 6. Post-deploy checks

- [ ] `/` and an interior page load fast (static/ISR)
- [ ] `/admin` reachable and can log in (this one is always dynamic — it hits the DB live)
- [ ] An admin edit appears on the public site within seconds (revalidation)
- [ ] "Live now" band + player YouTube tabs populate (YouTube key works in prod)
- [ ] Restrict the YouTube API key to the production domain (Google Cloud console)

---

## Operational notes

- If connects suddenly take **5–7s** again, the pooler is **saturated** (usually
  orphaned connections from multiple dev servers / `tsx` scripts). Fix: don't run
  more than one dev server; if needed, **restart the database** in the Supabase
  dashboard to drop all server-side connections.
- Don't run multiple local dev servers at once — each opens a pool and they race
  toward Supabase's client cap.
