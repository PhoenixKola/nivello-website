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
      intro="The main business, contact, and dispute-resolution information published by Nivello."
    >
      <p>
        This page provides the main legal details for Nivello. Please replace the placeholders below with your official registered company data before going live.
      </p>

      <section>
        <h2>Nivello</h2>
        <p>Studio name: Nivello</p>
        {/* <p>Registered office: [Your full address, city, country]</p>
        <p>Owner / legal representative: [Name or company]</p>
        <p>Business register: [City + register number]</p>
        <p>VAT number: [Your VAT number]</p> */}
      </section>

      <section>
        <h2>Alternative dispute resolution</h2>
        <p>
          The European ODR platform was discontinued on 20 July 2025. The European Commission provides current consumer information about alternative dispute resolution at:{' '}
          <a href="https://commission.europa.eu/topics/consumers/consumer-rights-and-complaints/resolve-your-consumer-complaint/alternative-dispute-resolution-consumers_en" target="_blank" rel="noreferrer">European Commission consumer ADR portal</a>.
        </p>
        <p>
          We are not obliged to participate in dispute resolution proceedings before a consumer arbitration board, but we are generally willing to do so where an amicable solution cannot be reached otherwise.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Email: <a href="mailto:office@nivello.it">office@nivello.it</a></p>
      </section>
    </LegalPage>
  )
}
