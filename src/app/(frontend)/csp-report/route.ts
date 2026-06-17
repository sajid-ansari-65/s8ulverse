import { NextResponse } from 'next/server'

// CSP violation sink (P4 / D-P1). The Content-Security-Policy-Report-Only header
// points `report-uri` here so we can SEE what a real policy would block before
// flipping CSP to enforcing. Deliberately minimal: parse, log, 204 — no DB, no
// auth, a hard body cap — so it can't be turned into a DoS or write amplifier.
//
// NOT under /api (that path is Payload's catch-all). robots already allows this;
// it only accepts POST from the browser's reporting agent.

export const dynamic = 'force-dynamic'

const MAX_BYTES = 16 * 1024 // ignore anything larger than 16 KB

export async function POST(req: Request) {
  try {
    const len = Number(req.headers.get('content-length') ?? 0)
    if (len > MAX_BYTES) return new NextResponse(null, { status: 413 })

    const text = await req.text()
    if (text.length > MAX_BYTES) return new NextResponse(null, { status: 413 })

    // Best-effort parse; both the legacy `report-uri` and `report-to` shapes.
    let report: unknown = text
    try {
      report = JSON.parse(text)
    } catch {
      /* keep raw text */
    }
    // Vercel captures stdout — surfaces in Runtime Logs without storing PII.
    console.warn('[csp-report]', JSON.stringify(report).slice(0, 4000))
  } catch {
    /* never throw from a reporting endpoint */
  }
  return new NextResponse(null, { status: 204 })
}
