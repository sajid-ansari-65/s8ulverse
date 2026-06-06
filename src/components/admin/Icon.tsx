'use client'

// Small admin header mark (next to the breadcrumb). Uses the S8UL mascot.
export default function Icon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/s8ul-logo-nav.webp"
      alt="S8UL"
      style={{ height: '30px', width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  )
}
