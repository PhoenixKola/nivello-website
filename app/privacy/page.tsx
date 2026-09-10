import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../seo'

export const metadata: Metadata = pageSeo.privacy

export default function PrivacyPage() {
  return (
    <LegalPage
      locale="en"
      kind="privacy"
      label="Privacy Policy"
      title="How we treat your data."
      intro="A clear overview of the information we collect, why we use it, and the choices available to you."
    >
      <p>
        Nivello respects the privacy of visitors and clients and is committed to protecting the personal data collected through this website and in the context of project collaborations.
      </p>

      <section>
        <h2>1. Personal data we collect</h2>
        <p>We collect personal data only when it is necessary, for example:</p>
        <ul>
          <li>information you provide via the contact form (name, email, company, project details)</li>
          <li>data exchanged by email when discussing potential or ongoing projects</li>
          <li>optional newsletter or update subscriptions, if activated in the future</li>
          <li>technical information such as anonymised analytics data, used to understand how the site is used</li>
        </ul>
        <p>
          Data is collected with your consent and processed in accordance with applicable data protection law, including the GDPR where it applies.
        </p>
      </section>

      <section>
        <h2>2. How we use the data</h2>
        <p>Personal data is used exclusively to:</p>
        <ul>
          <li>respond to enquiries and manage project communication</li>
          <li>prepare proposals, timelines and project documentation requested by you</li>
          <li>improve our services and the user experience on this website</li>
          <li>send occasional updates or information, only where you have explicitly agreed to receive them</li>
        </ul>
        <p>
          We do not sell your data and we do not share it with third parties except when required by law or when necessary to provide our services (for example, email or hosting providers).
        </p>
      </section>

      <section>
        <h2>3. Storage and security</h2>
        <p>
          Personal data is stored securely and only for as long as necessary for the purposes described above, or as required by law. We use appropriate technical and organisational measures to protect the data against unauthorised access, alteration, disclosure or deletion.
        </p>
      </section>

      <section>
        <h2>4. Your rights</h2>
        <p>Depending on the applicable law, you may have the right to:</p>
        <ul>
          <li>access the personal data we hold about you</li>
          <li>request correction or deletion of your data</li>
          <li>restrict or object to certain types of processing</li>
          <li>withdraw consent where processing is based on consent</li>
          <li>request portability of your data to another provider</li>
        </ul>
        <p>
          To exercise these rights, please contact us at <a href="mailto:office@nivello.it">office@nivello.it</a>.
        </p>
      </section>

      <section>
        <h2>5. Updates to this policy</h2>
        <p>
          This privacy policy may be updated from time to time to reflect changes in legislation or in how we work. The current version is the one published on this page.
        </p>
      </section>
    </LegalPage>
  )
}
