import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../seo'

export const metadata: Metadata = pageSeo.disclaimer

export default function DisclaimerPage() {
  return (
    <LegalPage
      locale="en"
      kind="disclaimer"
      label="Disclaimer"
      title="Use of this website."
      intro="The practical terms that apply when you browse Nivello’s website and use the information published here."
    >
      <p>
        Access to and use of this website are subject to the following terms and conditions. By continuing to browse, you accept these terms.
      </p>

      <section>
        <h2>1. Purpose and accuracy of information</h2>
        <p>
          The information on this website, including descriptions of services, processes, case studies and availability, is provided for general information only and may change at any time. While we make reasonable efforts to keep the content up to date, we do not guarantee that all information is complete, accurate or free from error. Nivello accepts no liability for any inaccuracies or omissions.
        </p>
      </section>

      <section>
        <h2>2. Changes to services</h2>
        <p>
          We reserve the right to modify, update or discontinue services, pricing, availability or approaches at any time and without prior notice, in order to maintain quality and adapt to client needs. Proposals and contracts agreed with individual clients prevail over the general information published on this site.
        </p>
      </section>

      <section>
        <h2>3. Limitation of liability</h2>
        <p>
          Nivello is not liable for any direct or indirect damage, loss or inconvenience arising from the use of this website, from reliance on the information contained here, or from the temporary unavailability of the site. Nothing on this website constitutes legal, financial or other professional advice.
        </p>
      </section>

      <section>
        <h2>4. Links to third-party sites</h2>
        <p>
          This website may contain links to external third-party sites. Such links are provided solely for convenience. Nivello has no control over these sites and is not responsible for their content, availability or privacy practices.
        </p>
      </section>

      <section>
        <h2>5. Intellectual property</h2>
        <p>
          All content on this website, including text, images, logos and visual layouts, is the property of Nivello or the respective rights holders and is protected by applicable copyright and intellectual property laws. Any use, reproduction or distribution of such content without prior written permission is prohibited.
        </p>
      </section>

      <section>
        <h2>6. Updates to this disclaimer</h2>
        <p>
          Nivello reserves the right to update or modify this disclaimer at any time. The current version is the one published on this page. We recommend checking this page regularly to stay informed of any changes.
        </p>
      </section>
    </LegalPage>
  )
}
