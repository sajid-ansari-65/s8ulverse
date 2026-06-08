import Link from 'next/link'

import { Initial, Pill } from '@/components/ui'
import { PLACEMENT_LABELS } from '@/lib/labels'
import { mediaUrl, resolveMany, type Achievement, type Member } from '@/lib/types'

// Shared honour/placement badges (I2) — defined once so OrgHonours, the legacy
// roster cards, and the player page all read consistently.

const PLACEMENT_ICON: Record<string, string> = {
  CHAMPION: '🏆',
  RUNNER_UP: '🥈',
  TOP_3: '🥉',
  QUALIFIED: '✓',
}

export function PlacementPill({ placement }: { placement?: string | null }) {
  if (!placement) return null
  const label = PLACEMENT_LABELS[placement] ?? placement
  const icon = PLACEMENT_ICON[placement] ?? '🏅'
  return (
    <Pill variant="ember">
      {icon} {label}
    </Pill>
  )
}

// Compact "🏆 N" team-trophy count for a roster card.
export function TrophyCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ember">
      🏆 {count}
    </span>
  )
}

// Individual-honour chips (title · year) for roster/player cards.
export function HonourChips({ honours }: { honours: Achievement[] }) {
  if (!honours.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {honours.map((h) => (
        <Pill key={h.slug} variant="ghost" className="!tracking-normal normal-case">
          {h.title}
          {h.year ? ` · ${h.year}` : ''}
        </Pill>
      ))}
    </div>
  )
}

// Winner avatars on a trophy card (D-I2) — capped at 4 + "+X", each linking to
// the player profile. Members are already populated (getOrgAchievements depth 1).
export function WinnerAvatars({
  members,
  accent,
}: {
  members?: (Member | string)[] | null
  accent: string
}) {
  const people = resolveMany<Member>(members ?? null)
  if (!people.length) return null
  const shown = people.slice(0, 4)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((m) => {
          const av = mediaUrl(m.avatar)
          return (
            <Link
              key={m.id}
              href={`/players/${m.slug}`}
              title={m.ign}
              className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-ink transition-transform hover:z-10 hover:scale-110"
            >
              {av ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={av} alt={m.ign} className="h-full w-full object-cover" />
              ) : (
                <Initial label={m.ign} accent={accent} className="h-full w-full" />
              )}
            </Link>
          )
        })}
      </div>
      {extra > 0 && <span className="font-mono text-[11px] text-faint">+{extra}</span>}
    </div>
  )
}
