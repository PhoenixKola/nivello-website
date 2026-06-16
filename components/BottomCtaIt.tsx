import Link from 'next/link'

export default function BottomCtaIt() {
  return (
    <section className="border-t border-slate-200 bg-linear-to-r from-emerald-50 via-white to-sky-50 dark:border-white/10 dark:from-emerald-500/10 dark:via-ink dark:to-sky-500/10">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
              Collaboriamo
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              Pronti a lanciare qualcosa di nuovo sul mercato italiano?
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300/80">
              Che si tratti di una landing page mirata, di un sito completo o di
              un restyling, ti aiutiamo a passare dall&apos;idea a
              un&apos;esperienza digitale pulita, chiara e credibile.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/it/contact"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Prenota una call conoscitiva
              </Link>
              <span className="text-xs text-slate-500 dark:text-slate-300">
                Call breve, senza impegno, in italiano o in inglese.
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Tipo di collaborazione
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Remote · EU friendly
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Durata dei progetti</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">2–6 settimane per la maggior parte dei siti</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Stile di lavoro</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">Aggiornamenti async, milestone chiare</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Lingue</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">Supporto in italiano e inglese</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
