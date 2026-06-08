import Link from 'next/link'
import type { CollectionSlug } from 'payload'

import { getPayloadClient } from '@/lib/payload'

// Custom admin homepage — replaces Payload's default card grid (which just
// duplicated the left sidebar) with a real content overview: live counts +
// recent activity. Server component, so it queries via the Local API directly.

const STATS: { label: string; slug: CollectionSlug; accent?: boolean }[] = [
  { label: 'Members', slug: 'members', accent: true },
  { label: 'Organizations', slug: 'organizations' },
  { label: 'Teams', slug: 'teams' },
  { label: 'Matches', slug: 'matches' },
  { label: 'Achievements', slug: 'achievements' },
  { label: 'Founders', slug: 'founders' },
  { label: 'Pages', slug: 'pages' },
  { label: 'Media', slug: 'media' },
]

const EMBER = '#ff5a36'

function fmtDate(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function Dashboard({
  user,
}: {
  user?: { email?: string | null, name?: string | null } | null
}) {
  const payload = await getPayloadClient()

  // Degrade gracefully — a single failed query shouldn't crash the admin home.
  let counts: { totalDocs: number }[] = STATS.map(() => ({ totalDocs: 0 }))
  let recentMembers: { docs: unknown[] } = { docs: [] }
  let upcomingMatches: { docs: unknown[] } = { docs: [] }
  try {
    ;[counts, recentMembers, upcomingMatches] = await Promise.all([
      Promise.all(STATS.map((s) => payload.count({ collection: s.slug }))),
      payload.find({ collection: 'members', sort: '-createdAt', limit: 5, depth: 1 }),
      payload.find({
        collection: 'matches',
        where: { status: { not_equals: 'COMPLETED' } },
        sort: 'startsAt',
        limit: 4,
        depth: 0,
      }),
    ])
  } catch (err) {
    console.error('[admin dashboard] data fetch failed:', err)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: 'var(--gutter-h, 24px)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: EMBER,
            fontWeight: 700,
          }}
        >
          S8ULverse · Overview
        </p>
        <h1 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {greeting}
          {user?.name ? `, ${user.name}.` : ''}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--theme-elevation-600)', fontSize: 14 }}>
          A live snapshot of the universe — jump straight into any collection below.
        </p>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {STATS.map((s, i) => (
          <Link
            key={s.slug}
            href={`/admin/collections/${s.slug}`}
            style={{
              display: 'block',
              padding: '20px 22px',
              borderRadius: 8,
              textDecoration: 'none',
              background: 'var(--theme-elevation-50)',
              border: `1px solid ${s.accent ? `${EMBER}55` : 'var(--theme-elevation-100)'}`,
              color: 'var(--theme-text)',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1,
                color: s.accent ? EMBER : 'var(--theme-text)',
                letterSpacing: '-0.02em',
              }}
            >
              {counts[i].totalDocs.toLocaleString('en-IN')}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--theme-elevation-600)',
                fontWeight: 600,
              }}
            >
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Two columns: recent members + upcoming matches */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        <Panel title="Recently added" href="/admin/collections/members">
          {recentMembers.docs.length === 0 ? (
            <Empty>No members yet.</Empty>
          ) : (
            recentMembers.docs.map((m) => {
              const doc = m as unknown as {
                id: string | number
                ign?: string
                role?: string
                slug?: string
              }
              return (
                <Row
                  key={doc.id}
                  href={`/admin/collections/members/${doc.id}`}
                  left={doc.ign ?? 'Untitled'}
                  right={doc.role ?? ''}
                />
              )
            })
          )}
        </Panel>

        <Panel title="Upcoming matches" href="/admin/collections/matches">
          {upcomingMatches.docs.length === 0 ? (
            <Empty>No upcoming matches scheduled.</Empty>
          ) : (
            upcomingMatches.docs.map((m) => {
              const doc = m as unknown as {
                id: string | number
                opponent?: string
                startsAt?: string
                status?: string
              }
              return (
                <Row
                  key={doc.id}
                  href={`/admin/collections/matches/${doc.id}`}
                  left={`vs ${doc.opponent ?? 'TBD'}`}
                  right={fmtDate(doc.startsAt)}
                  badge={doc.status === 'LIVE' ? 'LIVE' : undefined}
                />
              )
            })
          )}
        </Panel>
      </div>
    </div>
  )
}

// ─── Small presentational helpers (server components) ───────────────────────

function Panel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-100)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--theme-elevation-100)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--theme-elevation-700)',
          }}
        >
          {title}
        </span>
        <Link
          href={href}
          style={{ fontSize: 12, color: EMBER, textDecoration: 'none', fontWeight: 600 }}
        >
          View all →
        </Link>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Row({
  href,
  left,
  right,
  badge,
}: {
  href: string
  left: string
  right: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 18px',
        textDecoration: 'none',
        color: 'var(--theme-text)',
        borderBottom: '1px solid var(--theme-elevation-100)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {left}
        </span>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#fff',
              background: '#ef4444',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {badge}
          </span>
        )}
      </span>
      <span style={{ fontSize: 12, color: 'var(--theme-elevation-600)', whiteSpace: 'nowrap' }}>
        {right}
      </span>
    </Link>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px', fontSize: 14, color: 'var(--theme-elevation-500)' }}>
      {children}
    </div>
  )
}
