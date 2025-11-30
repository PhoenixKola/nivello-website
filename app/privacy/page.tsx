import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Nivello',
  description:
    'How Nivello handles personal data collected through this website and project enquiries.'
}

export default function PrivacyPage() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Privacy Policy
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            How we treat your data.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-6">
          <p>
            Nivello respects the privacy of visitors and clients and is
            committed to protecting the personal data collected through this
            website and in the context of project collaborations.
          </p>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              1. Personal data we collect
            </h2>
            <p className="mt-2">
              We collect personal data only when it is necessary, for example:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                information you provide via the contact form (name, email,
                company, project details)
              </li>
              <li>
                data exchanged by email when discussing potential or ongoing
                projects
              </li>
              <li>
                optional newsletter or update subscriptions, if activated in the
                future
              </li>
              <li>
                technical information such as anonymised analytics data, used to
                understand how the site is used
              </li>
            </ul>
            <p className="mt-2">
              Data is collected with your consent and processed in accordance
              with applicable data protection law, including the GDPR where it
              applies.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              2. How we use the data
            </h2>
            <p className="mt-2">
              Personal data is used exclusively to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>respond to enquiries and manage project communication</li>
              <li>
                prepare proposals, timelines and project documentation requested
                by you
              </li>
              <li>
                improve our services and the user experience on this website
              </li>
              <li>
                send occasional updates or information, only where you have
                explicitly agreed to receive them
              </li>
            </ul>
            <p className="mt-2">
              We do not sell your data and we do not share it with third parties
              except when required by law or when necessary to provide our
              services (for example, email or hosting providers).
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              3. Storage and security
            </h2>
            <p className="mt-2">
              Personal data is stored securely and only for as long as necessary
              for the purposes described above, or as required by law. We use
              appropriate technical and organisational measures to protect the
              data against unauthorised access, alteration, disclosure or
              deletion.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              4. Your rights
            </h2>
            <p className="mt-2">
              Depending on the applicable law, you may have the right to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>access the personal data we hold about you</li>
              <li>request correction or deletion of your data</li>
              <li>restrict or object to certain types of processing</li>
              <li>withdraw consent where processing is based on consent</li>
              <li>request portability of your data to another provider</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, please contact us at{' '}
              <a
                href="mailto:office@nivello.it"
                className="text-emerald-300 hover:text-emerald-200"
              >
                office@nivello.it
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              5. Updates to this policy
            </h2>
            <p className="mt-2">
              This privacy policy may be updated from time to time to reflect
              changes in legislation or in how we work. The current version is
              the one published on this page.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}