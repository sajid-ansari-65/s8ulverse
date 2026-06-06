'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { NavLink } from '@/lib/data'

// Falls back to these when the Navigation global is empty, so the header is
// never link-less even before it's filled in /admin.
const DEFAULT_LINKS: NavLink[] = [
  { label: 'Players', href: '/players' },
  { label: 'Orgs', href: '/orgs' },
  { label: 'EWC 2026', href: '/ewc' },
  { label: 'Honours', href: '/achievements' },
  { label: 'About', href: '/about' },
]

const isExternal = (href: string) => /^https?:\/\//.test(href)

export function SiteNav({ links, wordmark }: { links?: NavLink[]; wordmark?: string }) {
  const items = links && links.length ? links : DEFAULT_LINKS
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const active = (href: string) =>
    !isExternal(href) && (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? 'border-b border-line bg-ink/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/s8ul-logo-nav.webp"
            alt="S8UL"
            className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="display text-2xl tracking-tight text-ember">{wordmark ?? 'VERSE'}</span>
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-ember transition-transform group-hover:scale-150" />
        </Link>

        <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.2em] sm:flex">
          {items.map((item) => {
            const on = active(item.href)
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                target={isExternal(item.href) ? '_blank' : undefined}
                rel={isExternal(item.href) ? 'noopener noreferrer' : undefined}
                className={`relative transition-colors hover:text-bone ${
                  on ? 'text-bone' : 'text-bone-dim'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-ember transition-all duration-300 ${
                    on ? 'w-full' : 'w-0'
                  }`}
                />
              </Link>
            )
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center sm:hidden"
        >
          <span className="relative block h-3 w-5">
            <span
              className={`absolute left-0 h-px w-5 bg-bone transition-all ${
                open ? 'top-1.5 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-px w-5 bg-bone transition-opacity ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-bone transition-all ${
                open ? 'top-1.5 -rotate-45' : 'top-3'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <nav
        className={`overflow-hidden border-t border-line bg-ink/95 backdrop-blur-xl transition-[max-height] duration-500 sm:hidden ${
          open ? 'max-h-96' : 'max-h-0 border-transparent'
        }`}
      >
        <div className="flex flex-col px-5 py-2 font-mono text-xs uppercase tracking-[0.2em]">
          {items.map((item) => {
            const on = active(item.href)
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                target={isExternal(item.href) ? '_blank' : undefined}
                rel={isExternal(item.href) ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-2 border-b border-line/60 py-4 transition-colors ${
                  on ? 'text-ember' : 'text-bone-dim hover:text-bone'
                }`}
              >
                {on && <span className="h-1 w-1 rounded-full bg-ember" />}
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
