import BottomCtaIt from '@/components/BottomCtaIt'

export default function WorkPageIt() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Progetti
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Selezione di lavori e collaborazioni.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Una combinazione di progetti di prodotto, marketing e brand. Nomi e
            dettagli possono essere adattati al tuo portfolio reale.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:py-14">
          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Hospitality · Sito web
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Boutique hotel in Toscana
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Nuova identità visiva, sito orientato alle prenotazioni e
              campagne mirate per ospiti internazionali.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>+42% prenotazioni dirette in 6 mesi</li>
              <li>Migliore UX mobile per prenotazioni last-minute</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              SaaS · Sito prodotto
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Piattaforma di workflow per PMI italiane
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Posizionamento, landing page e onboarding pensati per team non
              tecnici.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Presentazione chiara delle funzionalità e dei piani</li>
              <li>Più richieste demo da traffico organico</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              E-commerce · Refresh brand
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Brand fashion direct-to-consumer
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Nuovo linguaggio visivo, storytelling di prodotto e landing
              dedicate per le uscite stagionali.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Percezione più premium del brand</li>
              <li>Maggiore tasso di aggiunta al carrello</li>
            </ul>
          </article>
        </div>
      </section>

      <BottomCtaIt />
    </div>
  )
}