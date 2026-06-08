import { Reveal } from '@/components/motion/Reveal'
import { formatNumber } from '@/lib/format'
import type { Social } from '@/lib/types'

const PLATFORM: Record<string, { label: string; color: string }> = {
  YOUTUBE: { label: 'YouTube', color: '#ff0033' },
  INSTAGRAM: { label: 'Instagram', color: '#e1306c' },
  TWITTER: { label: 'X', color: '#e7e9ea' },
  TWITCH: { label: 'Twitch', color: '#9146ff' },
  FACEBOOK: { label: 'Facebook', color: '#1877f2' },
  DISCORD: { label: 'Discord', color: '#5865f2' },
  TIKTOK: { label: 'TikTok', color: '#25f4ee' },
  SNAPCHAT: { label: 'Snapchat', color: '#fffc00' },
  WEBSITE: { label: 'Website', color: '#ff6a2a' },
  OTHER: { label: 'Link', color: '#a6a199' },
}

export function SocialPresence({ socials, bare = false }: { socials: Social[]; bare?: boolean }) {
  if (!socials.length) return null

  return (
    <section className={bare ? '' : 'mt-20'}>
      {!bare && (
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">
            Across the platforms
          </p>
          <h2 className="display mt-3 text-4xl text-bone">Social presence</h2>
        </Reveal>
      )}

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${bare ? '' : 'mt-8'}`}>
        {socials.map((s, i) => {
          const p = PLATFORM[s.platform] ?? PLATFORM.OTHER
          return (
            <Reveal key={s.id ?? i} delay={(i % 3) * 0.05}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-line bg-raise/50 p-5 transition-colors hover:border-ember/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                      {p.label}
                    </p>
                    <p className="truncate text-bone">{s.handle ?? p.label}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {s.followers != null ? (
                    <>
                      <p className="display text-2xl text-bone">{formatNumber(s.followers)}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                        followers
                      </p>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-ember opacity-0 transition-opacity group-hover:opacity-100">
                      visit →
                    </span>
                  )}
                </div>
              </a>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
