import Link from 'next/link'

const steps = [
  {
    title: 'Intro call and fit check',
    description:
      'We talk about your brand, goals, constraints, and what a good outcome looks like in your context.',
    clientView:
      'You speak directly with the people doing the work, not a sales team. We give you a first idea of scope and timing.',
    duration: '30–45 minutes'
  },
  {
    title: 'Scope, plan, and proposal',
    description:
      'We outline deliverables, milestones, and responsibilities so everyone knows what will happen and when.',
    clientView:
      'You receive a clear proposal you can review internally, including timeline, investment, and decision points.',
    duration: '3–5 days'
  },
  {
    title: 'Design and content',
    description:
      'We shape the structure, flows, and visual language. Content and copy are refined in parallel with design.',
    clientView:
      'You review layouts and key screens in Figma or similar, give focused feedback, and see iterations quickly.',
    duration: '1–3 weeks depending on scope'
  },
  {
    title: 'Build and implementation',
    description:
      'We implement the approved designs using modern front-end tools, keeping performance and accessibility in mind.',
    clientView:
      'You see regular previews on a staging URL and can test the experience on desktop and mobile before launch.',
    duration: '1–2 weeks for most marketing sites'
  },
  {
    title: 'Launch and refinement',
    description:
      'We launch the site, monitor key metrics, and make small adjustments based on real usage.',
    clientView:
      'You get a stable launch, documentation for the essentials, and the option to keep us as a partner for future iterations.',
    duration: 'First 1–2 weeks after launch'
  }
]

export default function ProcessPage() {
  return (
    <div className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            How we work
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            A clear, structured process from idea to launch.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            The details of every project change, but the way we collaborate
            stays predictable. This page shows what working with Nivello
            feels like from your side.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <ol className="space-y-8 border-l border-slate-800 pl-10 md:space-y-10 md:pl-12">
            {steps.map((step, index) => (
                <li key={step.title} className="relative">
                <div className="absolute -left-[34px] md:-left-10 mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/50">
                    {index + 1}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
                    <div className="md:basis-1/2">
                    <h2 className="text-sm font-semibold text-slate-50">
                        {step.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                        {step.description}
                    </p>
                    </div>
                    <div className="md:basis-1/2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        What you see
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                        {step.clientView}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                        Approx. duration: {step.duration}
                    </p>
                    </div>
                </div>
                </li>
            ))}
            </ol>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Next step
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-50 md:text-2xl">
                  Share a short brief and we will map the project for you.
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  You do not need a perfect document. A few paragraphs about
                  your brand, product, and goals are enough to start.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href="/contact"
                  className="rounded-full text-center bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
                >
                  Start the process
                </Link>
                <p className="text-xs text-slate-400">
                  We usually reply within one business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}