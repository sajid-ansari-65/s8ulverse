import { LiveNow } from '@/components/site/LiveNow'
import { getLiveCreators } from '@/lib/data'

// Async wrapper so the (slow, external) YouTube live-check streams in via
// <Suspense> instead of blocking the whole homepage's first paint. The band
// renders nothing until ≥1 creator is live, so a null Suspense fallback is
// invisible — the rest of the page paints immediately, this fills in after.
export async function LiveNowSection() {
  const creators = await getLiveCreators()
  return <LiveNow creators={creators} />
}
