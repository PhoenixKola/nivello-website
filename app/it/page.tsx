import Link from 'next/link'
import TestimonialsSectionIt from '@/components/TestimonialsSectionIt'
import FaqSectionIt from '@/components/FaqSectionIt'

export default function HomeIt() {
  return (
    <main className="bg-slate-950">
      {/* HERO – gradient like BottomCta */}
      <section className="border-b border-slate-900 bg-linear-to-r from-emerald-500/8 via-slate-950 to-sky-500/8">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:pb-24 md:pt-16">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              Studio digitale italiano
            </p>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
              Marketing, design e software su misura per brand ambiziosi.
            </h1>
            <p className="mb-6 max-w-xl text-sm text-slate-200 sm:text-base">
              Nivello Studio unisce strategia, estetica e tecnologia per aiutare le
              aziende italiane a presentarsi meglio, comunicare in modo chiaro e
              vendere di più. Dai landing site ai veri ecosistemi digitali.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                href="/it/work"
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200"
              >
                Vedi i lavori
              </Link>
              <Link
                href="/it/contact"
                className="rounded-full border border-slate-700 bg-slate-900/50 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/80"
              >
                Prenota una call
              </Link>
            </div>
            <div className="grid gap-4 text-xs text-slate-400 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/40 bg-linear-to-b from-emerald-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-emerald-300">
                  Marketing
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Funnel, campagne e automazioni pensati per il mercato italiano.
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-linear-to-b from-sky-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-sky-300">
                  Design
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Visual coerenti con il brand e interfacce pulite che trasmettono
                  qualità.
                </p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/40 bg-linear-to-b from-fuchsia-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-fuchsia-300">
                  Development
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Siti veloci e responsive sviluppati con React e Next.js.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-4xl bg-[conic-gradient(at_top,rgba(16,185,129,0.5),rgba(56,189,248,0.35),rgba(244,114,182,0.35),transparent_70%)] opacity-80 blur-3xl" />

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-lg shadow-emerald-500/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Progetto tipo
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-50">
                    Sito marketing pronto al lancio in 4–6 settimane.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Ideale per SaaS, agenzie e aziende di servizi che vogliono una
                    presenza moderna senza costruire un grande team interno.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-medium text-emerald-300">
                      Strategia e posizionamento
                    </span>
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[0.7rem] font-medium text-sky-300">
                      UX e visual design
                    </span>
                    <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-[0.7rem] font-medium text-fuchsia-300">
                      Sviluppo Next.js
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-md shadow-emerald-500/30">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Per team italiani
                    </p>
                    <p className="mt-1">
                      Siti bilingue, SEO locale e messaggi calibrati sul mercato
                      italiano ed europeo.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-md shadow-sky-500/30">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Modo di lavorare
                    </p>
                    <p className="mt-1">
                      Collaborazione anche in modalità async, milestone chiare e un
                      unico team snello che segue strategia, design e sviluppo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 – flat */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                Perché i brand italiani scelgono noi
              </h2>
              <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
                Uniamo standard internazionali a una conoscenza concreta del
                contesto italiano, dal tono di voce allo stile visivo.
              </p>
            </div>
            <Link
              href="/it/services"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Scopri i servizi →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Strategia prima di tutto
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Ogni progetto parte da posizionamento, obiettivi e un piano
                semplice ma chiaro.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Comunicazione trasparente
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Italiano o inglese, aggiornamenti strutturati e poche call
                davvero utili.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Stack moderno
              </p>
              <p className="mt-2 text-sm text-slate-300">
                React, Next.js e buone pratiche, per siti veloci e facili da
                evolvere nel tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 – gradient */}
      <section className="border-b border-slate-900 bg-linear-to-r from-slate-950 via-slate-950 to-fuchsia-500/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Un processo semplice in tre passi
            </h2>
            <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
              Niente call infinite, niente passaggi confusi. Solo un percorso
              chiaro dall&apos;idea al lancio.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-emerald-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                1
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Ascolto e analisi
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Capire il tuo brand, gli obiettivi e i vincoli per proporre uno
                scope concreto.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-sky-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                2
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Design e contenuti
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Costruiamo il linguaggio visivo, le pagine chiave e i testi
                allineati al pubblico.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-fuchsia-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                3
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Sviluppo e lancio
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Sviluppiamo, testiamo e pubblichiamo il sito, poi miglioriamo
                sulla base dei dati reali.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 – flat */}
      <section className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Progetti
              </p>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                Una fotografia di ciò che realizziamo.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Esempi reali tra hospitality, SaaS ed e-commerce. Puoi adattare
                nomi e dettagli ai tuoi casi studio.
              </p>
            </div>
            <Link
              href="/it/work"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Vedi altri progetti →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-emerald-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Hospitality · Sito web
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Boutique hotel in Toscana
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Nuova direzione visiva e sito orientato alle prenotazioni, con
                storytelling pensato per ospiti internazionali.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                +42% prenotazioni dirette in sei mesi.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-sky-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                SaaS · Sito prodotto
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Piattaforma di workflow per PMI
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Posizionamento e UX pensati per imprenditori e manager non
                tecnici.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                Più richieste demo da traffico organico.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-fuchsia-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                E-commerce · Refresh brand
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Brand fashion direct-to-consumer
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Linguaggio visivo più premium, in linea con l&apos;estetica
                streetwear europea.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                Maggior tasso di aggiunta al carrello sulle nuove collezioni.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 5 – gradient */}
      <section className="border-t border-slate-900 bg-linear-to-l from-slate-950 via-slate-950 to-sky-500/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Fit
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              I clienti con cui lavoriamo meglio.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Siamo il partner giusto se ti interessano i dettagli, vuoi un
              confronto onesto e preferisci una collaborazione che sembri un
              team interno.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-emerald-500/20">
              <p className="text-sm font-semibold text-slate-50">
                Ti troverai bene se
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Cerchi un look moderno e pulito, ma ancora umano.</li>
                <li>
                  Sei aperto a feedback chiari su messaggi, struttura e UX.
                </li>
                <li>
                  Preferisci aggiornamenti strutturati a riunioni infinite.
                </li>
                <li>
                  Vendi qualcosa di reale e vuoi che il sito rifletta quella
                  qualità.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-sky-500/20">
              <p className="text-sm font-semibold text-slate-50">
                Cosa puoi aspettarti
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>
                  Una timeline chiara e milestone definite prima di iniziare.
                </li>
                <li>
                  Design rivisti insieme in Figma o strumenti simili prima
                  dello sviluppo.
                </li>
                <li>
                  Implementazione veloce e responsive con React e Next.js.
                </li>
                <li>
                  Dettagli pensati per il mercato italiano ed europeo.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/it/contact"
                  className="rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
                >
                  Inizia una conversazione
                </Link>
                <Link
                  href="/it/services"
                  className="flex items-center text-xs font-medium text-emerald-300 hover:text-emerald-200"
                >
                  Scopri come lavoriamo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSectionIt />
      <FaqSectionIt />
    </main>
  )
}