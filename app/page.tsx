import Link from 'next/link'

export default function Home() {
  return (
    <main className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:pb-24 md:pt-16">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              Italian digital studio
            </p>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
              Marketing, design and custom software for ambitious brands.
            </h1>
            <p className="mb-6 max-w-xl text-sm text-slate-300 sm:text-base">
              Nivello Studio blends strategy, aesthetics, and technology to help
              Italian companies look sharp, communicate clearly, and sell
              better. From landing pages to full digital ecosystems.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                href="/work"
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200"
              >
                View our work
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/70"
              >
                Book a call
              </Link>
            </div>
            <div className="grid gap-4 text-xs text-slate-400 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  Marketing
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Funnels, campaigns and automation adapted to the Italian
                  market.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  Design
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Brand-aligned visuals and clean interfaces that feel premium.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  Development
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Fast, responsive websites built with modern React and Next.js.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-5 shadow-lg shadow-emerald-500/20">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Campaign performance</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-300">
                  Last 90 days
                </span>
              </div>
              <div className="mb-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Leads generated</span>
                  <span className="font-semibold text-slate-50">+214%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Conversion rate</span>
                  <span className="font-semibold text-emerald-300">
                    3.8%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Time to launch</span>
                  <span className="font-semibold text-slate-100">
                    14 days
                  </span>
                </div>
              </div>
              <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
                <p className="mb-1 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  Perfect for
                </p>
                <p>
                  Lean teams, agencies, and founders who need a reliable digital
                  partner without building a full in-house department.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                Why Italian brands work with us
              </h2>
              <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
                We mix international standards with a clear understanding of
                local expectations, from language nuance to visual style.
              </p>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Explore our services →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Strategy first
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Every project starts with positioning, goals, and a simple plan.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Clear communication
              </p>
              <p className="mt-2 text-sm text-slate-300">
                English or Italian, async-friendly, structured updates and
                timelines.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Modern tech stack
              </p>
              <p className="mt-2 text-sm text-slate-300">
                React, Next.js, and best practices so your site stays fast and
                easy to maintain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              A simple three-step process
            </h2>
            <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
              No endless calls, no messy handovers. Just a clear path from idea
              to launch.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300">
                1
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Discovery and audit
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We understand your goals, products, and market, then suggest a
                concrete scope.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300">
                2
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Design and content
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We craft the visual language, layouts, and copy tailored to your
                audience.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300">
                3
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Build and launch
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We build, test, and deploy your site, then iterate based on
                real-life usage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Featured work
              </p>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                A snapshot of what we build.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Real-world projects across hospitality, SaaS, and e-commerce.
                Names and details can be adapted to match your own portfolio.
              </p>
            </div>
            <Link
              href="/work"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              See more projects →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Hospitality · Website
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Boutique hotel in Tuscany
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                New brand direction and a booking-focused site that speaks to
                international guests.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                +42% direct bookings in six months.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                SaaS · Product site
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Workflow platform for SMEs
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Clear positioning and UX aimed at non-technical Italian
                business owners.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                More demo signups from organic traffic.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                E-commerce · Brand refresh
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Direct-to-consumer fashion label
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                A more premium visual language aligned with European streetwear
                aesthetics.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                Higher add-to-cart rate on new drops.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Fit
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Who we work best with.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              We are a good match if you care about details, want honest input,
              and prefer a partner that feels like part of your team.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-sm font-semibold text-slate-50">
                You&apos;ll feel at home if
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>You want a modern, clean look that still feels human.</li>
                <li>You are open to clear feedback on messaging and UX.</li>
                <li>You prefer structured updates over endless meetings.</li>
                <li>
                  You&apos;re selling something real and want the site to match
                  that quality.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-sm font-semibold text-slate-50">
                What you can expect
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>A clear timeline and defined milestones before we start.</li>
                <li>Designs reviewed in Figma or similar before development.</li>
                <li>Fast, responsive implementation using React and Next.js.</li>
                <li>
                  Thoughtful details tailored to the Italian and European
                  market.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
                >
                  Start a project conversation
                </Link>
                <Link
                  href="/services"
                  className="flex items-center text-xs font-medium text-emerald-300 hover:text-emerald-200"
                >
                  Learn more about how we work →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}