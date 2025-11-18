import BottomCtaIt from '@/components/BottomCtaIt'

export default function ServicesPageIt() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Servizi
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Tutto ciò che serve per una presenza digitale moderna.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Dalla prima impressione alla conversione finale, progettiamo e
            realizziamo il percorso completo dei tuoi clienti. Ideale per PMI,
            agenzie e founder che vogliono qualità senza costruire un team
            interno enorme.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:py-14">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Marketing e strategia
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Trasformiamo visibilità in lead reali, con offerte chiare e
              campagne strutturate.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Posizionamento e messaggi chiave</li>
              <li>Landing page e sales page</li>
              <li>Lead magnet ed email di nurturing</li>
              <li>Setup base di analytics e tracking</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideale per lanci, nuovi prodotti e rebranding.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Brand e product design
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Visual contemporanei che funzionano sia in Italia che sul mercato
              europeo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Look &amp; feel del brand</li>
              <li>UI per siti e applicazioni</li>
              <li>Design system e componenti riutilizzabili</li>
              <li>Visual per campagne e contenuti</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideale per SaaS, agenzie e business di servizi.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm font-semibold text-slate-50">
              Sviluppo e implementazione
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Siti veloci, SEO-friendly e basati su strumenti moderni, con
              attenzione alla manutenzione futura.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Siti corporate e landing di prodotto</li>
              <li>Frontend custom in React e Next.js</li>
              <li>Integrazione con headless CMS (su richiesta)</li>
              <li>Performance e accessibilità considerate da subito</li>
            </ul>
            <p className="mt-4 text-xs text-emerald-300">
              Ideale se cerchi un partner tecnico sul lungo periodo.
            </p>
          </div>
        </div>
      </section>

      <BottomCtaIt />
    </div>
  )
}