import type { Metadata } from 'next'

import { PageHero } from '@/components/site/PageHero'
import { Container } from '@/components/ui'
import { getSiteSettings } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How S8ULverse handles data — what we collect (almost nothing), cookies, analytics and your rights under the DPDP Act.',
  alternates: { canonical: '/privacy' },
}

export default async function PrivacyPage() {
  const site = await getSiteSettings()
  const updated = 'June 2026'

  return (
    <>
      <PageHero
        kicker="Data & safety"
        title="Privacy Policy"
        subtitle={`How ${site.siteName} handles data. Short version: we don't collect personal information from visitors.`}
        ghost="PRIVACY"
      />

      <Container className="pb-32">
        <div className="prose-page max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            Last updated · {updated}
          </p>

          <h2>What this site is</h2>
          <p>
            {site.siteName} is a public, read-only showcase of the S8UL family of esports
            organizations — rosters, honours and content. There are no visitor accounts, no sign-up,
            no comments and no forms. You can browse the entire site without giving us anything.
          </p>

          <h2>What we collect</h2>
          <p>
            <strong>From visitors: no personal data.</strong> We do not ask for your name, email,
            phone number or location, and we do not build advertising profiles or sell data — ever.
          </p>
          <ul>
            <li>
              <strong>Anonymous performance metrics.</strong> We use privacy-friendly,
              <em> cookieless</em> analytics (Vercel Speed Insights / Web Analytics) that record
              aggregate page-load timings and view counts. These do not identify you and contain no
              personal information.
            </li>
            <li>
              <strong>Standard server logs.</strong> Our hosting (Vercel) and CDN keep short-lived
              technical logs (IP address, user-agent, requested URL) to serve pages and defend
              against abuse. These are not used to identify or track you and are retained only
              briefly.
            </li>
            <li>
              <strong>Embedded media.</strong> Pages may embed YouTube and Instagram content. When
              such an embed loads, that third party may receive your IP address and set its own
              cookies under <em>its</em> privacy policy. We share nothing with them ourselves.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            The public site sets <strong>no tracking cookies</strong>. The only cookies are
            functional ones used by the private staff admin area (login sessions) — these are never
            set for ordinary visitors. Because we set no tracking or advertising cookies, there is
            no consent banner to click through.
          </p>

          <h2>How we protect data</h2>
          <p>
            The site is served entirely over HTTPS with modern security headers. The admin area is
            restricted by role-based access control with brute-force protection, and its data lives
            in an access-controlled database. We hold no visitor database to breach.
          </p>

          <h2>Your rights</h2>
          <p>
            Under India&rsquo;s Digital Personal Data Protection Act, 2023 (and equivalent laws such
            as the GDPR), you have rights over any personal data an organization holds about you.
            Because we do not collect personal data from visitors, there is normally nothing to
            access, correct or delete — but if you believe we hold information about you, contact us
            and we will respond.
          </p>

          <h2>Contact &amp; grievances</h2>
          <p>
            Questions, data requests or grievances about this policy:{' '}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy as the site evolves. The date at the top reflects the latest
            revision.
          </p>
        </div>
      </Container>
    </>
  )
}
