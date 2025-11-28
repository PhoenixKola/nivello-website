import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Imprint | Nivello Studio',
  description:
    'Legal information and contact details for Nivello Studio, a digital studio for marketing, design and development.'
}

export default function ImprintPage() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Imprint
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Legal information
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            This page provides the main legal details for Nivello Studio. Please
            replace the placeholders below with your official registered company
            data before going live.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-100">
              Nivello Studio
            </h2>
            <p>Studio name: Nivello Studio</p>
            <p>Registered office: [Your full address, city, country]</p>
            <p>Owner / legal representative: [Name or company]</p>
            <p>Business register: [City + register number]</p>
            <p>VAT number: [Your VAT number]</p>
          </div>

          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Online dispute resolution
            </h2>
            <p>
              The European Commission provides an online dispute resolution
              platform, available at:{' '}
              <a
                href="https://ec.europa.eu/odr"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
              >
                https://ec.europa.eu/odr
              </a>
              .
            </p>
            <p>
              We are not obliged to participate in dispute resolution
              proceedings before a consumer arbitration board, but we are
              generally willing to do so where an amicable solution cannot be
              reached otherwise.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">Contact</h2>
            <p>
              Email:{' '}
              <a
                href="mailto:office@nivello.it"
                className="text-emerald-300 hover:text-emerald-200"
              >
                office@nivello.it
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}