'use client'

import { useEffect } from 'react'

import { Reveal } from '@/components/motion/Reveal'

// Admin-curated Instagram embeds via Instagram's official embed.js — no API
// token needed. Each post URL becomes a real embedded post.
declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

export function InstagramFeed({ posts }: { posts: string[] }) {
  useEffect(() => {
    const id = 'instagram-embed-js'
    if (!document.getElementById(id)) {
      const s = document.createElement('script')
      s.id = id
      s.src = 'https://www.instagram.com/embed.js'
      s.async = true
      document.body.appendChild(s)
    }
    const t = setTimeout(() => window.instgrm?.Embeds.process(), 600)
    return () => clearTimeout(t)
  }, [posts])

  if (!posts.length) return null

  return (
    <section className="mt-20">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-kicker text-ember">On Instagram</p>
        <h2 className="display mt-3 text-4xl text-bone">Latest posts</h2>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((url, i) => (
          <blockquote
            key={i}
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            style={{ background: '#fff', borderRadius: 12, margin: 0, minWidth: '100%', width: '100%' }}
          />
        ))}
      </div>
    </section>
  )
}
