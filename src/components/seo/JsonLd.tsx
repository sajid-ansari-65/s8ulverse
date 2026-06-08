// Serialize structured data for embedding in a <script> tag. Any user-entered
// field (member bio, org name, brand blurb) can reach this, so we escape the
// HTML-significant characters plus the two JS line separators - U+2028 LINE
// SEPARATOR and U+2029 PARAGRAPH SEPARATOR, which are legal in JSON but break an
// inline script. This blocks a `</script>` breakout and stray injection - the
// equivalent of PHP's JSON_HEX_TAG. The separators are referenced by code point
// so this source file stays pure ASCII (no invisible bytes for tooling to
// mangle); the replacer rewrites every match as a \uXXXX escape.
const UNSAFE_JSON_LD = new RegExp(
  '[<>&' + String.fromCharCode(0x2028, 0x2029) + ']',
  'g',
)

function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(
    UNSAFE_JSON_LD,
    (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
  )
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
