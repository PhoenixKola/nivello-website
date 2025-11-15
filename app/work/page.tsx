import BottomCta from '@/components/BottomCta'

export default function WorkPage() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Our work
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Selected projects and collaborations.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            A mix of product, marketing, and brand work. Names and details can
            be adapted to match your actual portfolio.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:py-14">
          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Hospitality · Website
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Boutique hotel in Tuscany
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              New visual identity, booking-focused website, and targeted
              campaigns for international visitors.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>+42% direct bookings in 6 months</li>
              <li>Improved mobile UX for last-minute reservations</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              SaaS · Product site
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Workflow platform for Italian SMEs
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Positioning, landing page, and onboarding experience adapted to
              non-technical teams.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Clear pricing presentation and feature breakdown</li>
              <li>Improved demo signups from organic traffic</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              E-commerce · Brand refresh
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Direct-to-consumer fashion label
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              New brand language, product storytelling, and campaign landing
              pages for seasonal drops.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>More premium visual language</li>
              <li>Higher add-to-cart rate on new collections</li>
            </ul>
          </article>
        </div>
      </section>

      <BottomCta />
    </div>
  )
}