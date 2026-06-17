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
  webpack: (webpackConfig, { webpack, isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Payload's safeFetch + the Vercel Blob client upload handler pull in `undici`,
    // which imports Node builtins via the `node:` URI scheme (node:assert,
    // node:buffer, worker_threads, …). Webpack can't resolve the `node:` scheme,
    // so the build fails. Strip the prefix so the builtins resolve…
    webpackConfig.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, '')
      }),
    )

    // …and on the CLIENT bundle, cut the whole server-only chain out. The Vercel
    // Blob *client* upload handler pulls in payload's safeFetch → undici (a Node
    // HTTP client) which needs Node builtins. Client uploads are disabled, so this
    // never runs in the browser — alias undici to an empty module and stub the
    // Node-only builtins so the bundle just *resolves* at build time.
    if (!isServer) {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        undici: false,
        // The Vercel Blob client upload handler imports the cloud-storage utils,
        // which pull ALL of payload's server internals (file-type, dns, undici)
        // into the browser bundle. Client uploads are disabled, so cut the whole
        // package on the client — it's only used server-side.
        '@payloadcms/plugin-cloud-storage': false,
      }
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        assert: false,
        async_hooks: false,
        buffer: false,
        console: false,
        crypto: false,
        diagnostics_channel: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        net: false,
        os: false,
        path: false,
        perf_hooks: false,
        stream: false,
        tls: false,
        util: false,
        worker_threads: false,
        zlib: false,
      }
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
