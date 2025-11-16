import Link from 'next/link'

export default function BottomCta() {
  return (
    <section className="border-t border-slate-900 bg-linear-to-r from-emerald-500/10 via-slate-950 to-sky-500/10">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Let&apos;s collaborate
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Ready to launch something new for the Italian market?
            </h2>
            <p className="mt-3 max-w-xl text-sm text-slate-200">
              Whether you need a sharp landing page, a full product site, or a
              complete refresh, we can help you move from idea to a clean,
              working experience that feels premium and trustworthy.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200"
              >
                Book a discovery call
              </Link>
              <span className="text-xs text-slate-300">
                Short intro call, no obligation, English or Italian.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Typical engagement
              </p>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.7rem] text-slate-300">
                Remote · EU friendly
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Project length</dt>
                <dd className="font-medium text-slate-50">
                  2–6 weeks for most sites
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Collaboration style</dt>
                <dd className="font-medium text-slate-50">
                  Async updates, clear milestones
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Languages</dt>
                <dd className="font-medium text-slate-50">
                  Italian and English support
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}