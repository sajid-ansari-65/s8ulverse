import { ImageResponse } from 'next/og'

import { getMemberBySlug } from '@/lib/data'
import { asOrg, orgKit } from '@/lib/types'

export const alt = 'S8ULverse player profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded social card per player — name, role/position and the org accent.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const member = await getMemberBySlug(slug)
  const org = member ? asOrg(member.org) : null
  const accent = orgKit(org).primary
  const ign = (member?.ign ?? 'S8ULverse').toUpperCase()
  const eyebrow = [member?.role, member?.position].filter(Boolean).join(' · ') || 'S8ULVERSE'

  // hex → rgba so Satori parses the gradient reliably
  const hexA = (hex: string, a: number) => {
    const h = hex.replace('#', '')
    if (h.length !== 6) return `rgba(255,106,42,${a})`
    const n = parseInt(h, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          color: '#ece7dd',
          fontFamily: 'sans-serif',
          backgroundColor: '#08080b',
          backgroundImage: `linear-gradient(120deg, ${hexA(accent, 0.24)}, transparent 55%)`,
          borderBottom: `18px solid ${accent}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {eyebrow}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: ign.length > 11 ? 110 : 160,
              fontWeight: 800,
              lineHeight: 0.9,
            }}
          >
            {ign}
          </div>
          {member?.realName && (
            <div style={{ display: 'flex', fontSize: 42, color: '#a6a199', marginTop: 16 }}>
              {member.realName}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 30,
            color: '#a6a199',
          }}
        >
          <div style={{ display: 'flex', fontWeight: 700, color: '#ece7dd' }}>
            {org?.name ?? 'S8UL family'}
          </div>
          <div style={{ display: 'flex' }}>S8ULVERSE</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
