// YouTube Data API v3 — channel stats + live / featured / long-form / shorts.
// Key-gated: returns null when YOUTUBE_API_KEY is unset, so pages never break.
// Quota-cheap: derives "live" + classifies videos from the uploads playlist
// (playlistItems + videos.list) instead of the 100-unit search.list.

const KEY = process.env.YOUTUBE_API_KEY
const API = 'https://www.googleapis.com/youtube/v3'
const REVALIDATE = 60 * 60 // 1h — stats + video lists
const LIVE_REVALIDATE = 60 * 10 // 10m — "is this channel live right now"

// A short is YouTube's vertical micro-video. The API exposes no isShort flag,
// so we classify by duration: ≤ 60s (and not a live/premiere) = Short.
const SHORT_MAX_SECONDS = 60

export interface YtVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  views: number
  live: boolean
  durationSeconds: number
  isShort: boolean
}

export interface YtData {
  subscribers: number
  videoCount: number
  views: number
  channelUrl: string
  live: YtVideo | null
  featured: YtVideo | null
  videos: YtVideo[] // long-form uploads (most-recent first)
  shorts: YtVideo[]
}

type Json = Record<string, unknown> & { items?: any[] }

async function yt(
  path: string,
  params: Record<string, string>,
  revalidate: number = REVALIDATE,
): Promise<Json | null> {
  if (!KEY) return null
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: KEY }).toString()}`
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    return (await res.json()) as Json
  } catch {
    return null
  }
}

const pickThumb = (t: any): string =>
  t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? ''

// ISO-8601 duration ("PT1H2M3S") → seconds.
function parseDuration(iso?: string): number {
  if (!iso) return 0
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

export function extractVideoId(s?: string | null): string | null {
  if (!s) return null
  const m = s.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/)
  if (m) return m[1]
  return /^[\w-]{11}$/.test(s) ? s : null
}

function toVideo(v: any): YtVideo {
  const broadcast = v.snippet?.liveBroadcastContent ?? 'none'
  const durationSeconds = parseDuration(v.contentDetails?.duration)
  const live = broadcast === 'live'
  return {
    id: v.id,
    title: v.snippet?.title ?? '',
    thumbnail: pickThumb(v.snippet?.thumbnails),
    publishedAt: v.snippet?.publishedAt ?? '',
    views: Number(v.statistics?.viewCount ?? 0),
    live,
    durationSeconds,
    isShort: broadcast === 'none' && durationSeconds > 0 && durationSeconds <= SHORT_MAX_SECONDS,
  }
}

// Fetch + classify the latest uploads of a channel's uploads playlist.
async function fetchUploads(uploadsPlaylist: string, max: number): Promise<YtVideo[]> {
  const playlist = await yt('playlistItems', {
    part: 'contentDetails',
    playlistId: uploadsPlaylist,
    maxResults: String(max),
  })
  const ids = (playlist?.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean)
  if (!ids.length) return []
  const vids = await yt('videos', {
    part: 'snippet,statistics,contentDetails',
    id: ids.join(','),
  })
  return (vids?.items ?? []).map(toVideo)
}

export async function getYouTube(
  handle?: string | null,
  featured?: string | null,
): Promise<YtData | null> {
  if (!KEY || !handle) return null

  const channel = await yt('channels', {
    part: 'statistics,contentDetails',
    forHandle: handle.replace(/^@/, ''),
  })
  const c = channel?.items?.[0]
  if (!c) return null

  const uploads: string | undefined = c.contentDetails?.relatedPlaylists?.uploads
  const data: YtData = {
    subscribers: Number(c.statistics?.subscriberCount ?? 0),
    videoCount: Number(c.statistics?.videoCount ?? 0),
    views: Number(c.statistics?.viewCount ?? 0),
    channelUrl: `https://youtube.com/channel/${c.id}`,
    live: null,
    featured: null,
    videos: [],
    shorts: [],
  }

  if (uploads) {
    // 50 = the API max for one playlistItems + one videos.list call (still 1
    // quota unit each). Wide enough that Shorts deeper in the feed still surface.
    const items = await fetchUploads(uploads, 50)
    data.live = items.find((v) => v.live) ?? null
    const normal = items.filter((v) => !v.live)
    data.shorts = normal.filter((v) => v.isShort)
    data.videos = normal.filter((v) => !v.isShort)
  }

  // Featured: admin-picked video wins; else the most recent long-form upload.
  const fid = extractVideoId(featured)
  if (fid) {
    const fv = await yt('videos', { part: 'snippet,statistics,contentDetails', id: fid })
    if (fv?.items?.[0]) data.featured = toVideo(fv.items[0])
  }
  if (!data.featured) data.featured = data.videos[0] ?? null
  // Avoid showing the featured video twice in the Videos tab.
  if (data.featured) data.videos = data.videos.filter((v) => v.id !== data.featured!.id)

  return data
}

// ─── Lean live check for the homepage "Live now" band ───────────────────────
// ~3 quota units/channel, cached 10m. Returns the live video if streaming.
export async function getLiveStatus(
  handle?: string | null,
): Promise<{ video: YtVideo; channelUrl: string } | null> {
  if (!KEY || !handle) return null

  const channel = await yt(
    'channels',
    { part: 'contentDetails', forHandle: handle.replace(/^@/, '') },
    LIVE_REVALIDATE,
  )
  const c = channel?.items?.[0]
  const uploads: string | undefined = c?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) return null

  const playlist = await yt(
    'playlistItems',
    { part: 'contentDetails', playlistId: uploads, maxResults: '5' },
    LIVE_REVALIDATE,
  )
  const ids = (playlist?.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean)
  if (!ids.length) return null

  const vids = await yt(
    'videos',
    { part: 'snippet,statistics,contentDetails', id: ids.join(',') },
    LIVE_REVALIDATE,
  )
  const liveItem = (vids?.items ?? []).map(toVideo).find((v: YtVideo) => v.live)
  if (!liveItem) return null
  return { video: liveItem, channelUrl: `https://youtube.com/channel/${c.id}` }
}
