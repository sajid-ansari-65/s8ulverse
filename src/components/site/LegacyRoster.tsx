import Link from 'next/link'

import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { HonourChips, TrophyCount } from '@/components/site/honours'
import { Initial, Pill, SectionHeading } from '@/components/ui'
import { formatStints } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/labels'
import { splitHonours } from '@/lib/roster'
import { asTeam, mediaUrl, type Achievement, type RosterMember } from '@/lib/types'

// The heart of asks 4 & 5 — an org's full roster from day one to now. Receives the
// already-grouped players/staff from the page (G owns groupRoster) + the honour map
// (built once on the page, no N+1). Current players are hero image cards; alumni +
// staff are compact cards. All fields null-safe.

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ')

type RosterGroup = { current: RosterMember[]; alumni: RosterMember[] }
type HonourMap = Map<string, Achievement[]>

const roleLabel = (rm: RosterMember) =>
  rm.member.position ?? ROLE_LABELS[rm.roleAtOrg] ?? rm.roleAtOrg

const honoursFor = (rm: RosterMember, map: HonourMap) =>
  splitHonours(map.get(String(rm.member.id)) ?? [])

function HeroCard({ rm, accent, map }: { rm: RosterMember; accent: string; map: HonourMap }) {
  const m = rm.member
  const av = mediaUrl(m.avatar)
  const team = asTeam(rm.team ?? null)
  const { team: teamHonours, individual } = honoursFor(rm, map)
  return (
    <Link href={`/players/${m.slug}`} className="group block h-full">
      <TiltCard
        accent={accent}
        className="h-full overflow-hidden rounded-2xl border border-line bg-raise/50"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {av ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={av}
              alt={m.ign}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <Initial label={m.ign} accent={accent} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {rm.isFounding && (
              <Pill variant="ember" className="backdrop-blur">
                Day one
              </Pill>
            )}
            <Pill variant="ghost" className="bg-ink/50 backdrop-blur">
              {roleLabel(rm)}
            </Pill>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <h3 className="display text-3xl text-bone">{m.ign}</h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dim">
              {formatStints(rm.stints)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {team && (
                <Pill variant="ghost" className="bg-ink/50 backdrop-blur">
                  {team.name}
                </Pill>
              )}
              <TrophyCount count={teamHonours.length} />
            </div>
            <HonourChips honours={individual} />
          </div>
        </div>
      </TiltCard>
    </Link>
  )
}

function CompactCard({ rm, accent, map }: { rm: RosterMember; accent: string; map: HonourMap }) {
  const m = rm.member
  const av = mediaUrl(m.avatar)
  const team = asTeam(rm.team ?? null)
  const { team: teamHonours, individual } = honoursFor(rm, map)
  const former = !rm.isCurrent
  return (
    <Link href={`/players/${m.slug}`} className="group block h-full">
      <TiltCard
        accent={accent}
        className={cx(
          'flex h-full items-start gap-4 rounded-2xl border border-line p-4',
          former ? 'bg-raise/30 opacity-80 transition-opacity group-hover:opacity-100' : 'bg-raise/50',
        )}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
          {av ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={av} alt={m.ign} className="h-full w-full object-cover" />
          ) : (
            <Initial label={m.ign} accent={accent} className="h-full w-full" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display truncate text-xl text-bone">{m.ign}</h3>
            {rm.isFounding && <Pill variant="ember">Day one</Pill>}
            {former && <Pill variant="ghost">Former</Pill>}
          </div>
          {m.realName && <p className="truncate text-sm text-bone-dim">{m.realName}</p>}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            {roleLabel(rm)} · {formatStints(rm.stints)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {team && <Pill variant="ghost">{team.name}</Pill>}
            <TrophyCount count={teamHonours.length} />
          </div>
          <HonourChips honours={individual} />
        </div>
      </TiltCard>
    </Link>
  )
}

function Block({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="mt-12 first:mt-10">
      <p className="font-mono text-[11px] uppercase tracking-kicker text-faint">{kicker}</p>
      {children}
    </div>
  )
}

const heroGrid = 'mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'
const compactGrid = 'mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function LegacyRoster({
  players,
  staff,
  honourMap,
  accent,
}: {
  players: RosterGroup
  staff: RosterGroup
  honourMap: HonourMap
  accent: string
}) {
  const hasPlayers = players.current.length > 0 || players.alumni.length > 0
  const hasStaff = staff.current.length > 0 || staff.alumni.length > 0

  return (
    <section id="roster" className="scroll-mt-24 pt-24">
      <SectionHeading kicker="Day one to now" title="The roster" />

      {!hasPlayers && !hasStaff && (
        <p className="mt-10 font-mono text-sm text-faint">
          No roster yet — add members &amp; tenures in /admin.
        </p>
      )}

      {players.current.length > 0 && (
        <Block kicker="Current roster">
          <div className={heroGrid}>
            {players.current.map((rm, i) => (
              <Reveal key={rm.member.id} delay={(i % 4) * 0.06}>
                <HeroCard rm={rm} accent={accent} map={honourMap} />
              </Reveal>
            ))}
          </div>
        </Block>
      )}

      {players.alumni.length > 0 && (
        <Block kicker="Alumni">
          <div className={compactGrid}>
            {players.alumni.map((rm, i) => (
              <Reveal key={rm.member.id} delay={(i % 3) * 0.05}>
                <CompactCard rm={rm} accent={accent} map={honourMap} />
              </Reveal>
            ))}
          </div>
        </Block>
      )}

      {staff.current.length > 0 && (
        <Block kicker="Staff">
          <div className={compactGrid}>
            {staff.current.map((rm, i) => (
              <Reveal key={rm.member.id} delay={(i % 3) * 0.05}>
                <CompactCard rm={rm} accent={accent} map={honourMap} />
              </Reveal>
            ))}
          </div>
        </Block>
      )}

      {staff.alumni.length > 0 && (
        <Block kicker="Former staff">
          <div className={compactGrid}>
            {staff.alumni.map((rm, i) => (
              <Reveal key={rm.member.id} delay={(i % 3) * 0.05}>
                <CompactCard rm={rm} accent={accent} map={honourMap} />
              </Reveal>
            ))}
          </div>
        </Block>
      )}
    </section>
  )
}
