import { ImageResponse } from 'next/og'

export const alt = 'S8ULverse — Where legends live'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Dynamic social share card for the homepage.
export default function Image() {
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
          backgroundImage:
            'linear-gradient(120deg, rgba(255,106,42,0.22), transparent 45%, rgba(10,106,214,0.18))',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 10,
            textTransform: 'uppercase',
            color: '#1b6fff',
          }}
        >
          S8UL · SouL · 8Bit · 8Bit Creative
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, lineHeight: 0.92 }}>
            WHERE
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 150,
              fontWeight: 800,
              lineHeight: 0.92,
              color: '#1b6fff',
            }}
          >
            LEGENDS LIVE
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
          <div style={{ display: 'flex' }}>The S8UL family · one universe</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
