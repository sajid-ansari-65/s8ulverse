import Link from 'next/link'

import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { Initial, Pill } from '@/components/ui'
import { formatNumber } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/labels'
import { asOrg, mediaUrl, orgKit, type Member } from '@/lib/types'

// Roster card grid — shared by the homepage teaser and the full /players page.
export function RosterGrid({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <p className="mt-10 font-mono text-sm text-faint">
        No members yet — add players & creators in /admin.
      </p>
    )
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {members.map((m, i) => {
        const org = asOrg(m.org)
        const accent = orgKit(org).primary
        const avatar = mediaUrl(m.avatar)
        const top = m.socials?.[0]
        return (
          <Reveal key={m.id} delay={(i % 4) * 0.06}>
            <Link href={`/players/${m.slug}`} className="group block h-full">
              <TiltCard
                accent={accent}
                className="h-full overflow-hidden rounded-2xl border border-line bg-raise/50"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={m.ign}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <Initial label={m.ign} accent={accent} className="h-full w-full" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <Pill variant="ghost" className="bg-ink/50 backdrop-blur">
                      {m.position ?? ROLE_LABELS[m.role] ?? m.role}
                    </Pill>
                    {m.isVerified && (
                      <Pill variant="ember" className="backdrop-blur">
                        ★
                      </Pill>
                    )}
                  </div>
                  <div className="absolute inset-x-4 bottom-4 transition-transform duration-500 ease-out group-hover:-translate-y-1">
                    <h3 className="display text-3xl text-bone">{m.ign}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dim">
                      {org?.shortName ?? org?.name ?? '—'}
                      {top?.followers != null && (
                        <span className="text-faint"> · {formatNumber(top.followers)}</span>
                      )}
                    </p>
                    <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover:mt-2 group-hover:grid-rows-[1fr]">
                      <div className="overflow-hidden">
                        <span
                          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{ color: accent }}
                        >
                          <span className="h-px w-5" style={{ backgroundColor: accent }} /> View profile →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Link>
          </Reveal>
        )
      })}
    </div>
  )
}
