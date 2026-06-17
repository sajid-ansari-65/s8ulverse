import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// Report-only CSP (P4 / D-P1): observe what the JSON-LD inline + Next runtime +
// YouTube/Instagram embeds actually need before switching to an enforcing policy.
// Report-only never blocks, so it's safe across the inline-heavy /admin UI too.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://www.instagram.com https://platform.instagram.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com",
  "connect-src 'self' https:",
  "base-uri 'self'",
  "form-action 'self'",
  // Lock down a few high-value directives now (these never break a normal site):
  "object-src 'none'",
  "frame-ancestors 'self'",
  // Capture would-be violations at /csp-report so we can tighten toward an
  // enforcing policy (drop 'unsafe-inline'/'unsafe-eval') once the report is clean.
  'report-uri /csp-report',
].join('; ')

// Baseline security headers (P4). HSTS only in prod (HTTPS).
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
