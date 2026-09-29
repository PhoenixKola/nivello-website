import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.terms

export default function TermsPage() {
  return (
    <LegalPage
      locale="en"
      kind="terms"
      label="Terms & Conditions"
      title="Working together, clearly."
      intro="The general terms for Nivello's websites, web apps, and other digital project work."
    >
      <p>
        These terms describe how we work with clients. A proposal or project agreement accepted in writing sets the specific scope, price, and schedule for each project. If it says something different, that agreement takes precedence.
      </p>

      <section>
        <h2>1. Project scope</h2>
        <p>Before work begins, we agree on the deliverables, timeline, feedback rounds, and any services such as hosting or maintenance. Work outside that scope is discussed and agreed separately.</p>
      </section>

      <section>
        <h2>2. Working together</h2>
        <p>Clients provide the content, access, decisions, and feedback needed to move the project forward. If an input is delayed or the scope changes, we will discuss any effect on the schedule or cost before proceeding.</p>
      </section>

      <section>
        <h2>3. Fees and payment</h2>
        <p>Fees, payment stages, and due dates are stated in the accepted proposal or invoice. Additional work is quoted and agreed before it is added to the project.</p>
      </section>

      <section>
        <h2>4. Content and ownership</h2>
        <p>Clients keep the rights to materials they provide and confirm they are entitled to use them in the project. Rights to the final deliverables are set out in the project agreement. Third-party fonts, software, images, and services remain subject to their own licences and terms.</p>
      </section>

      <section>
        <h2>5. Confidentiality and portfolio work</h2>
        <p>We treat non-public project information as confidential. Publicly released work, client names, and logos may be featured in our portfolio where the project agreement or the client allows it. Client trademarks remain the property of their owners.</p>
      </section>

      <section>
        <h2>6. Launch and ongoing services</h2>
        <p>Launch assistance, hosting, maintenance, and ongoing support are included only when stated in the agreed scope. External platforms and providers may have separate terms.</p>
      </section>

      <section>
        <h2>7. Changes, pauses, and concerns</h2>
        <p>If a project is paused or cancelled, the accepted agreement determines how completed work and payments are handled. Please raise concerns with us promptly so we can discuss a practical solution. Nothing on this page limits rights that cannot be limited by applicable law.</p>
      </section>

      <section>
        <h2>8. Contact and updates</h2>
        <p>For questions about these terms, email <a href="mailto:office@nivello.it">office@nivello.it</a>. We may update this page for future projects; changes here do not alter an existing written agreement.</p>
      </section>
    </LegalPage>
  )
}
