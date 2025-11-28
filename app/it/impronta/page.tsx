import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impronta | Nivello Studio',
  description:
    'Informazioni legali e dati di contatto di Nivello Studio, studio digitale per marketing, design e sviluppo.'
}

export default function ImprontaPageIt() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Impronta
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Informazioni legali
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            In questa pagina trovi i principali dati legali di Nivello Studio.
            Prima di pubblicare il sito, sostituisci i seguenti campi con i
            dati ufficiali della tua attività.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-100">
              Nivello Studio
            </h2>
            <p>Denominazione: Nivello Studio</p>
            <p>Indirizzo sede: [Indirizzo completo, città, paese]</p>
            <p>Titolare / legale rappresentante: [Nome o ragione sociale]</p>
            <p>Registro imprese: [Città e numero di iscrizione]</p>
            <p>Partita IVA: [Inserisci la tua Partita IVA]</p>
          </div>

          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Risoluzione delle controversie online
            </h2>
            <p>
              La Commissione Europea mette a disposizione una piattaforma per la
              risoluzione delle controversie online, accessibile al seguente
              link:{' '}
              <a
                href="https://ec.europa.eu/odr"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
              >
                https://ec.europa.eu/odr
              </a>
              .
            </p>
            <p>
              Non siamo obbligati a partecipare a una procedura di
              risoluzione delle controversie davanti a un organismo di
              conciliazione per i consumatori, ma siamo generalmente disponibili
              a farlo qualora non sia possibile trovare una soluzione amichevole
              in altro modo.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">Contatti</h2>
            <p>
              Email:{' '}
              <a
                href="mailto:office@nivello.it"
                className="text-emerald-300 hover:text-emerald-200"
              >
                office@nivello.it
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}