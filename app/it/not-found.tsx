import Link from 'next/link'

export default function NotFoundIt() {
  return (
    <div className="flex min-h-[70vh] items-center bg-slate-950">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
        <p className="text-7xl font-semibold tracking-tight text-emerald-400 md:text-9xl">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-slate-50 md:text-2xl">
          La pagina richiesta non è disponibile.
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Potrebbe trattarsi di un link non valido o di un contenuto non ancora
          pubblicato. Può usare il menu in alto oppure scegliere una delle
          opzioni qui sotto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/it"
            className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
          >
            Torna alla homepage
          </Link>
          <Link
            href="/it/contact"
            className="rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/70"
          >
            Contatti
          </Link>
        </div>
      </div>
    </div>
  )
}