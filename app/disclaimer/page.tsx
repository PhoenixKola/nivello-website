import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | Nivello Studio',
  description:
    'Disclaimer for the use of the Nivello Studio website and information provided on it.'
}

export default function DisclaimerPage() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Disclaimer
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Use of this website.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-6">
          <p>
            Access to and use of this website are subject to the following terms
            and conditions. By continuing to browse, you accept these terms.
          </p>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              1. Purpose and accuracy of information
            </h2>
            <p className="mt-2">
              The information on this website, including descriptions of
              services, processes, case studies and availability, is provided
              for general information only and may change at any time. While we
              make reasonable efforts to keep the content up to date, we do not
              guarantee that all information is complete, accurate or free from
              error. Nivello Studio accepts no liability for any inaccuracies or
              omissions.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              2. Changes to services
            </h2>
            <p className="mt-2">
              We reserve the right to modify, update or discontinue services,
              pricing, availability or approaches at any time and without prior
              notice, in order to maintain quality and adapt to client needs.
              Proposals and contracts agreed with individual clients prevail
              over the general information published on this site.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              3. Limitation of liability
            </h2>
            <p className="mt-2">
              Nivello Studio is not liable for any direct or indirect damage,
              loss or inconvenience arising from the use of this website, from
              reliance on the information contained here, or from the temporary
              unavailability of the site. Nothing on this website constitutes
              legal, financial or other professional advice.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              4. Links to third-party sites
            </h2>
            <p className="mt-2">
              This website may contain links to external third-party sites. Such
              links are provided solely for convenience. Nivello Studio has no
              control over these sites and is not responsible for their content,
              availability or privacy practices.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              5. Intellectual property
            </h2>
            <p className="mt-2">
              All content on this website, including text, images, logos and
              visual layouts, is the property of Nivello Studio or the
              respective rights holders and is protected by applicable
              copyright and intellectual property laws. Any use, reproduction or
              distribution of such content without prior written permission is
              prohibited.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              6. Updates to this disclaimer
            </h2>
            <p className="mt-2">
              Nivello Studio reserves the right to update or modify this
              disclaimer at any time. The current version is the one published
              on this page. We recommend checking this page regularly to stay
              informed of any changes.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}