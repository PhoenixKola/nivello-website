import BottomCta from '@/components/BottomCta'

export default function ServicesPage() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Services
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Everything you need for a modern digital presence.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            From first impression to final conversion, we design and build the
            full journey for your customers. Ideal for Italian SMEs, agencies,
            and founders who want quality without a huge internal team.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:py-14">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Marketing and strategy
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Turn visibility into real leads with clear offers and structured
              campaigns.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Positioning and messaging</li>
              <li>Landing pages and sales pages</li>
              <li>Email flows and lead magnets</li>
              <li>Basic analytics and tracking setup</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideal for launches, new products, and rebrands.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Brand and product design
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Clean, contemporary visuals that feel at home in the Italian and
              European market.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Brand look and feel</li>
              <li>Website and app UI design</li>
              <li>Design systems and components</li>
              <li>Marketing visuals and assets</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideal for SaaS, agencies, and service businesses.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Development and implementation
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Fast, SEO-friendly websites built on modern tools with a focus on
              maintainability.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Corporate sites and landing pages</li>
              <li>Custom React and Next.js frontends</li>
              <li>Headless CMS integration (on request)</li>
              <li>Performance and accessibility in mind</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideal when you want a long-term technical partner.
            </p>
          </div>
        </div>
      </section>

      <BottomCta />
    </div>
  )
}