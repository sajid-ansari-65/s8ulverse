# Deep-dive P — Security hardening

Status: **DESIGN LOCKED** (added during review — [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-P1** headers + report-only CSP first · **D-P2** harden API in prod.
Found + scheduled a **live XSS fix** (JsonLd escaping, P3a).
SQLi + general attack-surface hardening for the Payload v3 / Next 15 / Supabase stack,
sized to the bigger structure (more admin-entered fields → more injected-data surface).

---

## P0. Threat model for THIS stack (frame it right)

- **Reads are public + static** (Local API behind ISR) → no per-request query injection
  surface from anonymous users; pages are pre-rendered.
- **Writes go through Payload** (admin auth + access control + Drizzle parameterized
  queries). The realistic surfaces are: **(a)** the Supabase **PostgREST** exposure
  (O7/RLS), **(b)** **stored XSS** from admin-entered data rendered on public pages,
  **(c)** **admin/API auth** hardening, **(d)** headers/CSP. SQLi is largely a non-issue
  *if* we never hand-roll SQL.

---

## P1. SQL injection — parameterized everywhere

- **Payload + Drizzle parameterize all queries** (Local API, REST, GraphQL). Our
  `where` filters (`{ slug: { equals: routeSlug } }`, `{ org: { equals: id } }`) are
  **parameterized** — route slugs/ids are never string-concatenated into SQL. ✅
- **Rule:** never build raw SQL with user input. The only raw SQL is the **RLS
  migration (O7)** — static DDL, no user input. If any future hook needs raw SQL, use
  Drizzle's parameter binding, never template strings.
- Targeted-revalidation slug lookups (O4) use Payload `find` → parameterized. ✅

→ SQLi is **not a live risk** here; documented so it stays that way.

---

## P2. Access control (the core Payload control)

- Collections currently set `access: { read: () => true }` and rely on Payload's
  **default write = authenticated-only**. **Verify every collection** — incl. new
  **Tenures, Brands** — exposes **read public, write (create/update/delete) admin-only**.
  Don't accidentally pass `() => true` to write access.
- **Field-level:** SEO/internal fields need no special rule; nothing should be
  publicly writable. Media upload = admin-only (default).
- **GraphQL/REST inherit** collection access → public can read, only auth can mutate.
  Confirm after adding the new collections.

---

## P3. XSS

**🔴 P3a — `JsonLd` breakout (FOUND VULN, fix required).**
`components/seo/JsonLd.tsx` does `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}`
— **`JSON.stringify` does not escape `</script>`**, `<`, `>`, `&`, U+2028/U+2029. Any
admin field in the graph (bio, **brand name**, **tenure note**, org description, ign) that
contains `</script>…` **breaks out and executes**. Latent today; our feature feeds ~40
more user fields into JSON-LD (G/J/I). **Fix:**
```ts
const json = JSON.stringify(data)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/ /g, '\\u2028').replace(/ /g, '\\u2029')
// …dangerouslySetInnerHTML={{ __html: json }}
```
One-line-ish, zero downside; hardens every JSON-LD surface at once.

- **P3b — React auto-escaping:** all text rendered via JSX (`{member.bio}`, brand names,
  notes) is **auto-escaped** → safe. Keep it that way; **no `dangerouslySetInnerHTML`**
  for user text anywhere except sanitized richtext.
- **P3c — Lexical richtext (Pages):** admin-authored `body` rendered to HTML — ensure the
  Payload Lexical→HTML path is the official serializer (no raw passthrough). Pages are
  admin-only content, but treat as defense-in-depth.
- **P3d — external embeds:** Instagram `embed.js` + YouTube are third-party scripts on
  admin-curated URLs (validate URL shape). Factor into CSP (P4).

---

## P4. Security headers + CSP (D-P1)

Currently no security headers. Add a baseline (via `next.config` `headers()` or
middleware):
- `Strict-Transport-Security` (prod), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`
  (or `frame-ancestors` CSP), `Permissions-Policy` (lock down camera/mic/geo).
- **CSP** is the hard part — we have **inline JSON-LD** + **Next inline runtime** +
  **IG/YT embeds**. Options (D-P1):
  - **Pragmatic baseline** — the headers above + a **report-only CSP** first (observe
    breakage from embeds before enforcing) — **[recommended]**.
  - **Strict nonce CSP** now — strongest, but nonce-ing Next inline + third-party embeds
    is fiddly and risks breaking IG/YT/JSON-LD.
- Admin (`/admin`) may need looser CSP than the public site (Payload UI uses inline) →
  scope CSP to the `(frontend)` route group.

---

## P5. Auth & API hardening (D-P2)

- **`PAYLOAD_SECRET`** strong (`openssl rand -base64 32`, already documented); rotate if
  ever leaked. Cookies httpOnly+secure+sameSite in prod (Payload defaults; confirm over
  HTTPS). Set Payload **`csrf`** allowed-origins to the real domain in prod.
- **Admin login throttle** — Payload has `maxLoginAttempts`/`lockTime` on the auth
  collection; set them on **Users**.
- **GraphQL/REST exposure (D-P2):** Payload exposes `/api/graphql` (+ playground) and
  REST. Decide:
  - **Harden** — **disable the GraphQL playground in prod**, add **query depth/complexity
    limits**, keep REST/GraphQL (read-public/write-auth) — **[recommended]**.
  - **Leave default** — playground + introspection on (handy, but a recon/DoS surface).
- First-run admin creation at `/admin` — ensure it's done before the site is public (no
  open admin-bootstrap window in prod).

---

## P6. RLS (cross-ref O7)

Enabling RLS deny-by-default (O7/D-O1) is **also a security control** — without it the
Supabase anon key reads/writes tables over PostgREST, bypassing all of P2's Payload
access control. P and O share this fix; it must ship.

---

## P7. Misc hygiene

- **Uploads (Media):** restrict mime types + max size on the Media collection (admin-only
  already, but cap to images + sane size).
- **Secrets:** `.env` gitignored; never echo `YOUTUBE_API_KEY`/`PAYLOAD_SECRET`/
  `DATABASE_URL` (CLAUDE.md gotcha). Restrict the YT key by referrer/API (already a
  next-step).
- **Dependencies:** `npm audit` in CI; keep Payload/Next patched (security releases).
- **DoS posture:** public pages static (ISR) → cheap; the `max:4` pool is the bottleneck
  on cache-miss storms → transaction pooler in prod (O5) + ISR shields it.
- **No secrets in JSON-LD/OG** (only public profile data).

---

## P8. Deltas

- **Fix now (low effort, high value):** `JsonLd` escaping (P3a); verify Tenures/Brands
  write-access (P2); Users `maxLoginAttempts`/`lockTime` (P5).
- **Phase-0/deploy:** RLS migration (O7); security headers + report-only CSP (P4);
  disable GraphQL playground + `csrf` origins in prod (P5); Media upload limits (P7).
- Files: `components/seo/JsonLd.tsx`, `next.config`/middleware (headers), `payload.config`
  (csrf, graphQL prod opts), `collections/Users.ts`, new collections' `access`.

---

## P-decisions — LOCKED

- **D-P1** ✅ Ship standard **security headers + report-only CSP first** (observe IG/YT/
  JSON-LD needs, then enforce); admin route group scoped looser than `(frontend)`.
- **D-P2** ✅ **Harden the API in prod** — GraphQL playground + introspection **off**,
  depth/complexity limits, REST/GraphQL kept with read-public/write-auth.
