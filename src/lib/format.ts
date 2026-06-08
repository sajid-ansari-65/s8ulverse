// Display helpers (previously @esports/utils).

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return String(n)
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Month+year helpers (tenures / brands) ──────────────────────────────────
// The month picker stores the day pinned to 01; we read the date's UTC month so
// there's no off-by-one at month boundaries. All null-safe.

export function formatMonthYear(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', timeZone: 'UTC' })
}

// "Mar 2019 – Present" | "Mar 2019 – Aug 2021"
export function formatTenureRange(joinedAt?: string | null, leftAt?: string | null): string {
  const start = formatMonthYear(joinedAt)
  if (!start) return ''
  return `${start} – ${leftAt ? formatMonthYear(leftAt) : 'Present'}`
}

const yearOf = (value?: string | null): string =>
  value ? String(new Date(value).getUTCFullYear()) : ''

// Multi-spell: "2019–2020 · 2022–present" (rejoins). Collapses to a single full
// range when there's only one stint.
export function formatStints(stints: { joinedAt?: string | null; leftAt?: string | null }[]): string {
  const rows = (stints ?? [])
    .filter((s) => s?.joinedAt)
    .sort((a, b) => new Date(a.joinedAt as string).getTime() - new Date(b.joinedAt as string).getTime())
  if (!rows.length) return ''
  if (rows.length === 1) return formatTenureRange(rows[0].joinedAt, rows[0].leftAt)
  return rows
    .map((s) => {
      const start = yearOf(s.joinedAt)
      const end = s.leftAt ? yearOf(s.leftAt) : 'present'
      return start === end ? start : `${start}–${end}`
    })
    .join(' · ')
}

// "Since 2023" | "2023 – 2024" | "Until 2024" | null (no dates → omit the line)
export function formatBrandWindow(start?: string | null, end?: string | null): string | null {
  const s = formatMonthYear(start)
  const e = formatMonthYear(end)
  if (s && e) return `${s} – ${e}`
  if (s) return `Since ${s}`
  if (e) return `Until ${e}`
  return null
}
