import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../seo'

export const metadata: Metadata = pageSeo.imprint

export default function ImprintPage() {
  return (
    <LegalPage
      locale="en"
      kind="imprint"
      label="Imprint"
      title="Legal information."
      intro="The business name and contact details for this website."
    >
      <p>
        Nivello is a digital studio developing websites and web apps for businesses. You can contact us about this website or our services using the details below.
      </p>

      <section>
        <h2>Nivello</h2>
        <p>Studio name: Nivello</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Email: <a href="mailto:office@nivello.it">office@nivello.it</a></p>
      </section>
    </LegalPage>
  )
}
