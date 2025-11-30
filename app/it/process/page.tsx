import Link from 'next/link'

const steps = [
  {
    title: 'Call iniziale e valutazione',
    description:
      'Parliamo del tuo brand, degli obiettivi, dei vincoli e di cosa significa un buon risultato per te.',
    clientView:
      'Parli direttamente con chi segue il progetto, non con un team commerciale. Ti diamo subito un&apos;idea di direzione e tempistiche.',
    duration: '30–45 minuti'
  },
  {
    title: 'Scope, piano e proposta',
    description:
      'Definiamo deliverable, milestone e responsabilità, così tutti sanno cosa succederà e quando.',
    clientView:
      'Ricevi una proposta chiara da condividere internamente, con timeline, investimento e punti decisionali.',
    duration: '3–5 giorni'
  },
  {
    title: 'Design e contenuti',
    description:
      'Progettiamo struttura, flussi e linguaggio visivo. Contenuti e copy vengono raffinati in parallelo al design.',
    clientView:
      'Rivedi layout e schermate chiave in Figma o strumenti simili, dai feedback mirati e vedi le iterazioni rapidamente.',
    duration: '1–3 settimane a seconda dello scope'
  },
  {
    title: 'Sviluppo e implementazione',
    description:
      'Implementiamo i design approvati usando strumenti front-end moderni, con attenzione a performance e accessibilità.',
    clientView:
      'Hai anteprime regolari su uno staging URL e puoi testare l&apos;esperienza su desktop e mobile prima del lancio.',
    duration: '1–2 settimane per la maggior parte dei siti marketing'
  },
  {
    title: 'Lancio e ottimizzazione',
    description:
      'Lanciamo il sito, monitoriamo i dati principali e facciamo piccole regolazioni sulla base dell&apos;uso reale.',
    clientView:
      'Hai un lancio stabile, una documentazione essenziale e la possibilità di tenerci come partner per i passi successivi.',
    duration: 'Prime 1–2 settimane dopo il lancio'
  }
]

export default function ProcessPageIt() {
  return (
    <div className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Come lavoriamo
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Un processo chiaro e strutturato, dall&apos;idea al lancio.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Ogni progetto è diverso nei dettagli, ma il modo in cui
            collaboriamo rimane prevedibile. Qui trovi cosa significa lavorare
            con Nivello dal tuo punto di vista.
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
                      Cosa vedi tu
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {step.clientView}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      Durata indicativa: {step.duration}
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
                  Prossimo passo
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-50 md:text-2xl">
                  Inviaci un breve brief e mappiamo il progetto insieme.
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Non serve un documento perfetto. Bastano qualche paragrafo sul
                  tuo brand, il prodotto e gli obiettivi per cominciare.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href="/it/contact"
                  className="rounded-full text-center bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
                >
                  Inizia il processo
                </Link>
                <p className="text-xs text-slate-400">
                  Di solito rispondiamo entro un giorno lavorativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}