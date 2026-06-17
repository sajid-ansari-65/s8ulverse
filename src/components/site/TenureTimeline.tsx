import Link from 'next/link'

import { Reveal } from '@/components/motion/Reveal'
import { Pill } from '@/components/ui'
import { formatTenureRange } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/labels'
import { asOrg, asTeam, orgKit, type Tenure } from '@/lib/types'

// Factual per-org stint history (entry → exit), oldest → newest — the multi-org
// career. A single player who passed through more than one org (e.g. 8Bit → SouL)
// shows every stint here, each tinted with that org's accent and linking back to
// the org's legacy page. Distinct from the narrative `career[]` "Journey" tab.
export function TenureTimeline({ tenures, bare = false }: { tenures: Tenure[]; bare?: boolean }) {
  if (!tenures.length) return null

  return (
    <section className={bare ? '' : 'mt-20'}>
      {!bare && (
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-kicker text-accent">Every era</p>
          <h2 className="display mt-3 text-4xl text-bone">Career</h2>
        </Reveal>
      )}

      <div className={`relative pl-9 sm:pl-12 ${bare ? '' : 'mt-8'}`}>
        <div className="absolute bottom-2 left-0 top-2 w-px bg-gradient-to-b from-kit-blue via-kit-green to-kit-white" />

        <div className="space-y-8">
          {tenures.map((t, i) => {
            const org = asOrg(t.org)
            const team = asTeam(t.team)
            // External (non-family) club: no Organization record, just a name + maybe a link.
            const external = !org && t.externalOrg ? t.externalOrg : null
            const accent = external ? '#5a5a66' : orgKit(org).primary
            const isCurrent = !t.leftAt
            const roleLabel = ROLE_LABELS[t.role] ?? t.role
            const year = (t.joinedAt ?? '').slice(0, 4)

            return (
              <Reveal key={t.id ?? i} delay={(i % 6) * 0.05}>
                <div className="relative">
                  <span
                    className="absolute -left-9 top-[9px] h-2.5 w-2.5 rounded-full ring-4 ring-ink sm:-left-12"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                    <span className="display shrink-0 text-2xl text-bone/35 sm:w-20">{year}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {org ? (
                          <Link
                            href={`/orgs/${org.slug}`}
                            className="text-lg font-semibold text-bone transition-colors hover:text-accent"
                          >
                            {org.name}
                          </Link>
                        ) : external ? (
                          t.externalUrl ? (
                            <a
                              href={t.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold text-bone-dim transition-colors hover:text-bone"
                            >
                              {external} ↗
                            </a>
                          ) : (
                            <h3 className="text-lg font-semibold text-bone-dim">{external}</h3>
                          )
                        ) : (
                          <h3 className="text-lg font-semibold text-bone">—</h3>
                        )}
                        {external && (
                          <Pill variant="ghost" className="text-[10px]">
                            External
                          </Pill>
                        )}
                        {t.isFounding && (
                          <Pill variant="ember" className="text-[10px]">
                            Founding
                          </Pill>
                        )}
                        {isCurrent && (
                          <Pill variant="solid" className="text-[10px]">
                            Current
                          </Pill>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                        {roleLabel}
                        {team && <span className="text-bone-dim"> · {team.name}</span>}
                        <span className="text-bone-dim"> · {formatTenureRange(t.joinedAt, t.leftAt)}</span>
                      </p>
                      {t.note && (
                        <p className="mt-1 max-w-2xl text-xs italic leading-relaxed text-faint">{t.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
