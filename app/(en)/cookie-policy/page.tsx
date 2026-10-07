import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.cookies

export default function CookiePolicyPage() {
  return (
    <LegalPage
      locale="en"
      kind="cookies"
      label="Cookie Policy"
      title="Cookies and browser storage."
      intro="What this website stores in your browser, why, and how to control it. We describe what the site actually does today."
    >
      <section>
        <h2>1. In short</h2>
        <p>
          The public Nivello website does not set advertising, profiling or third-party tracking cookies, and it does not load third-party analytics, social media widgets or ad scripts. It only uses technical storage that the site needs to work, plus first-party, aggregate statistics that do not use cookies. For this reason no consent is requested; a short notice tells you about it on your first visit.
        </p>
      </section>

      <section>
        <h2>2. What is stored in your browser</h2>
        <ul>
          <li>
            <strong>theme</strong> (local storage) — remembers whether you chose the light or dark theme. Technical; kept until you clear it.
          </li>
          <li>
            <strong>nv_privacy_notice</strong> (local storage) — remembers that you closed the privacy notice, so it is not shown on every page. Technical; kept until you clear it.
          </li>
          <li>
            <strong>nv_sid</strong> and <strong>nv_once_*</strong> (session storage) — a random identifier and a few flags used only to count visits and conversion steps in aggregate (for example, how many visits reached the contact form). They exist only for the current browser tab and are deleted when you close it.
          </li>
          <li>
            <strong>Homepage introduction</strong> (session storage) — remembers that the homepage animation already played in this tab. Deleted when you close the tab.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Aggregate statistics</h2>
        <p>
          Statistics are collected by Nivello itself and stored on our own server. We record page paths, referring sites, device type, language and an approximate country (looked up from your network address in a database on our own server, or from your browser&apos;s time zone). The random tab identifier is kept on our server only to count unique visits per day. IP addresses are not stored for statistics; to protect the service from abuse, a salted hash of the network address is kept for a few minutes and rotated daily. We do not build individual profiles and do not combine this data with other sources or share it with third parties. When your browser sends a Do Not Track or Global Privacy Control signal, no statistics are collected at all.
        </p>
      </section>

      <section>
        <h2>4. Third-party services</h2>
        <p>
          When you send the contact form, the information you entered is transmitted to Formspree, the service that delivers it to us by email. Nothing is sent to Formspree before you submit the form. Links to client websites in our portfolio open those sites, which apply their own cookie policies.
        </p>
      </section>

      <section>
        <h2>5. Your choices</h2>
        <p>
          You can delete local and session storage at any time from your browser settings, and enable Do Not Track or Global Privacy Control to stop statistics entirely. Because no non-essential cookies are used, there is no consent to give or withdraw. If this changes, we will update this page and ask for your consent before any non-essential tool runs.
        </p>
        <p>
          This policy follows the Italian Data Protection Authority (Garante per la protezione dei dati personali) guidelines on cookies and other tracking tools. For any question write to <a href="mailto:office@nivello.it">office@nivello.it</a>. More about how we handle personal data is in the <a href="/privacy/">Privacy Policy</a>.
        </p>
      </section>
    </LegalPage>
  )
}
