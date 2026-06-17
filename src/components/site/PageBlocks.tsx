import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import { CountUp } from '@/components/motion/CountUp'
import { Reveal } from '@/components/motion/Reveal'
import { FoundersStrip } from '@/components/site/FoundersStrip'
import { RosterGrid } from '@/components/site/RosterGrid'
import { Container, SectionHeading } from '@/components/ui'
import { getAllMembers, getFeaturedMembers, getFounders } from '@/lib/data'
import { mediaUrl, type MediaDoc } from '@/lib/types'

// A layout block as stored by Payload — typed loosely; each view reads its own fields.
type Block = { blockType?: string; id?: string } & Record<string, unknown>

// ── Individual block views ──────────────────────────────────────────────────

function RichTextView({ content }: { content: unknown }) {
  if (!content) return null
  return (
    <Container className="pt-12">
      <article className="prose-page max-w-3xl">
        <RichText data={content as SerializedEditorState} />
      </article>
    </Container>
  )
}

function SectionView({ b }: { b: Block }) {
  return (
    <Container className="pt-20">
      <Reveal>
        <SectionHeading kicker={(b.kicker as string) || ''} title={(b.heading as string) || ''} />
      </Reveal>
      {b.content ? (
        <article className="prose-page mt-8 max-w-3xl">
          <RichText data={b.content as SerializedEditorState} />
        </article>
      ) : null}
    </Container>
  )
}

function StatsView({ items }: { items: { label: string; value: number; compact?: boolean }[] }) {
  if (!items?.length) return null
  return (
    <Container className="pt-20">
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {items.map((s, i) => (
            <div key={i} className="bg-ink p-7">
              <div className="display text-5xl text-bone sm:text-6xl">
                <CountUp to={Number(s.value) || 0} compact={s.compact} />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </Container>
  )
}

function CtaView({ b }: { b: Block }) {
  return (
    <Container className="pt-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-raise/40 px-8 py-16 text-center sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(60% 80% at 50% 0%, rgba(255,106,42,0.18), transparent 60%)',
            }}
          />
          {b.eyebrow ? (
            <p className="relative font-mono text-[11px] uppercase tracking-kicker text-accent">
              {b.eyebrow as string}
            </p>
          ) : null}
          <h2 className="relative mx-auto mt-5 max-w-3xl text-balance display text-5xl leading-[0.95] text-bone sm:text-7xl">
            {b.heading as string}
          </h2>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em]">
            {b.primaryLabel && b.primaryHref ? (
              <Link
                href={b.primaryHref as string}
                className="rounded-full bg-accent px-6 py-3 text-ink transition-transform hover:scale-105"
              >
                {b.primaryLabel as string}
              </Link>
            ) : null}
            {b.secondaryLabel && b.secondaryHref ? (
              <Link
                href={b.secondaryHref as string}
                className="rounded-full border border-line px-6 py-3 text-bone-dim transition-colors hover:text-bone"
              >
                {b.secondaryLabel as string}
              </Link>
            ) : null}
          </div>
        </div>
      </Reveal>
    </Container>
  )
}

async function RosterView({ b }: { b: Block }) {
  const members = b.source === 'all' ? await getAllMembers() : await getFeaturedMembers()
  return (
    <Container className="pt-20">
      {Boolean(b.kicker || b.heading) && (
        <Reveal>
          <SectionHeading
            kicker={(b.kicker as string) || 'The faces'}
            title={(b.heading as string) || 'Roster'}
          />
        </Reveal>
      )}
      <RosterGrid members={members} />
    </Container>
  )
}

async function FoundersView({ b }: { b: Block }) {
  const founders = await getFounders()
  return (
    <FoundersStrip
      founders={founders}
      heading={{
        kicker: (b.kicker as string) || 'The architects',
        title: (b.heading as string) || 'Founders',
      }}
    />
  )
}

function MediaView({ b }: { b: Block }) {
  const url = mediaUrl(b.image as MediaDoc | string | null)
  if (!url) return null
  const img = (
    <figure className={b.fullBleed ? '' : 'overflow-hidden rounded-2xl border border-line'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={(b.caption as string) || ''} className="w-full object-cover" />
      {b.caption ? (
        <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          {b.caption as string}
        </figcaption>
      ) : null}
    </figure>
  )
  return b.fullBleed ? (
    <div className="pt-20">{img}</div>
  ) : (
    <Container className="pt-20">
      <Reveal>{img}</Reveal>
    </Container>
  )
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export function PageBlocks({ blocks }: { blocks?: Block[] | null }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((b, i) => {
        const key = b.id ?? i
        switch (b.blockType) {
          case 'richText':
            return <RichTextView key={key} content={b.content} />
          case 'section':
            return <SectionView key={key} b={b} />
          case 'stats':
            return (
              <StatsView
                key={key}
                items={(b.items as { label: string; value: number; compact?: boolean }[]) ?? []}
              />
            )
          case 'cta':
            return <CtaView key={key} b={b} />
          case 'roster':
            return <RosterView key={key} b={b} />
          case 'foundersBlock':
            return <FoundersView key={key} b={b} />
          case 'mediaBlock':
            return <MediaView key={key} b={b} />
          default:
            return null
        }
      })}
    </>
  )
}
