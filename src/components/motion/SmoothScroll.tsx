'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

// Global smooth-scroll layer (Lenis) — the single biggest "premium feel" upgrade.
// Momentum scrolling that stays in sync with the page's scroll-linked motion
// (Hero parallax, ScrollProgress) since Lenis drives the native scroll position.
//
// Disabled entirely for prefers-reduced-motion AND coarse pointers (touch): those
// keep crisp native scrolling — Lenis momentum on a phone feels worse, not better.
// Renders nothing; it's a behaviour-only provider mounted once in the layout.
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return

    const lenis = new Lenis({
      duration: 1.05, // calm, premium glide — not floaty
      easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // In-page anchor links (#roster, org sub-nav) — let Lenis handle the glide.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      const id = a?.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (target) {
        e.preventDefault()
        lenis.scrollTo(target as HTMLElement, { offset: -80 })
      }
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      lenis.destroy()
    }
  }, [])

  return null
}
