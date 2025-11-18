import Link from 'next/link'

export default function BottomCtaIt() {
  return (
    <section className="border-t border-slate-900 bg-gradient-to-r from-emerald-500/10 via-slate-950 to-sky-500/10">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Collaboriamo
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Pronti a lanciare qualcosa di nuovo sul mercato italiano?
            </h2>
            <p className="mt-3 max-w-xl text-sm text-slate-200">
              Che si tratti di una landing page mirata, di un sito completo o di
              un restyling, ti aiutiamo a passare dall&apos;idea a
              un&apos;esperienza digitale pulita, chiara e credibile.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/it/contact"
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200"
              >
                Prenota una call conoscitiva
              </Link>
              <span className="text-xs text-slate-300">
                Call breve, senza impegno, in italiano o in inglese.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Tipo di collaborazione
              </p>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.7rem] text-slate-300">
                Remote · EU friendly
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Durata dei progetti</dt>
                <dd className="font-medium text-slate-50">
                  2–6 settimane per la maggior parte dei siti
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Stile di lavoro</dt>
                <dd className="font-medium text-slate-50">
                  Aggiornamenti async, milestone chiare
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Lingue</dt>
                <dd className="font-medium text-slate-50">
                  Supporto in italiano e inglese
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}