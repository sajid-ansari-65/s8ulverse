import { ImageResponse } from 'next/og'

import { getOrgAchievements, getOrgBySlug, getOrgRoster } from '@/lib/data'
import { groupRoster, splitHonours } from '@/lib/roster'
import { orgKit } from '@/lib/types'

export const alt = 'S8ULverse — organization legacy'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded social card per org (D-G2): name · accent · "N members · M titles".
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await getOrgBySlug(slug)

  const name = org?.name ?? 'S8ULverse'
  const accent = orgKit(org).primary
  let members = 0
  let titles = 0
  if (org) {
    const [roster, ach] = await Promise.all([getOrgRoster(org.id), getOrgAchievements(org.id)])
    members = groupRoster(roster).current.length
    titles = splitHonours(ach).team.length
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
          backgroundImage: `linear-gradient(120deg, ${accent}38, transparent 50%, ${accent}1f)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 10,
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          S8ULverse · Legacy
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, lineHeight: 0.92 }}>
            {name}
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 36, color: '#a6a199' }}>
            {members} active members · {titles} titles
          </div>
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
          <div style={{ display: 'flex', fontWeight: 700, color: '#ece7dd' }}>S8ULVERSE</div>
          <div style={{ display: 'flex' }}>Every player · every era · every trophy</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
