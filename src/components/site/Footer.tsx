import Link from 'next/link'

import type { NavData, SiteSettings } from '@/lib/data'

const isExternal = (href: string) => /^https?:\/\//.test(href)

// Used when the Navigation global has no footer columns yet.
const DEFAULT_COLUMNS: NavData['footerColumns'] = [
  {
    heading: 'Explore',
    links: [
      { label: 'Players', href: '/players' },
      { label: 'Organizations', href: '/orgs' },
      { label: 'EWC 2026', href: '/ewc' },
      { label: 'Honours', href: '/achievements' },
    ],
  },
  {
    heading: 'Studio',
    links: [{ label: 'About', href: '/about' }],
  },
]

export function SiteFooter({ nav, site }: { nav?: NavData; site?: SiteSettings }) {
  const columns = nav?.footerColumns?.length ? nav.footerColumns : DEFAULT_COLUMNS
  const social = nav?.social ?? []
  const orgs = site?.familyOrgs?.length ? site.familyOrgs : ['S8UL', 'SouL', '8Bit', '8Bit Creative']
  const tagline = nav?.footerTagline || site?.tagline || 'Where legends live.'
  const location = site?.location || 'Surat · India'
  const copyrightName = site?.copyrightName || 'S8ULverse'

  return (
    <footer className="relative z-10 mt-32 border-t border-line">
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <div className="relative overflow-hidden py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
            The universe of
          </p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {orgs.map((o) => (
              <span key={o} className="display text-4xl text-bone/80 sm:text-6xl">
                {o}
              </span>
            ))}
          </div>

          {/* Link columns + social */}
          <div className="mt-14 grid grid-cols-2 gap-10 border-t border-line pt-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links?.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        target={isExternal(l.href) ? '_blank' : undefined}
                        rel={isExternal(l.href) ? 'noopener noreferrer' : undefined}
                        className="text-sm text-bone-dim transition-colors hover:text-ember"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {social.length > 0 && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Follow
                </p>
                <ul className="mt-4 space-y-3">
                  {social.map((s) => (
                    <li key={s.platform + s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-bone-dim transition-colors hover:text-ember"
                      >
                        {s.platform} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-faint sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} {copyrightName}</span>
            <span className="text-bone-dim">{tagline}</span>
            <span>{location}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
