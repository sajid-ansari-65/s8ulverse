'use client'

// Admin login + nav graphic. Uses the real S8UL mascot mark from /public.
export default function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/s8ul-logo-nav.webp"
        alt="S8UL"
        style={{ height: '140px', width: 'auto', objectFit: 'contain' }}
      />
    </div>
  )
}
