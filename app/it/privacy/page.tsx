import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy | Nivello Studio',
  description:
    'Come Nivello Studio gestisce i dati personali raccolti tramite il sito e durante le collaborazioni.'
}

export default function PrivacyPageIt() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Privacy Policy
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Come trattiamo i tuoi dati.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-6">
          <p>
            Nivello Studio rispetta la privacy di visitatori e clienti e si
            impegna a proteggere i dati personali raccolti tramite questo sito e
            nell&apos;ambito delle collaborazioni professionali.
          </p>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              1. Dati personali raccolti
            </h2>
            <p className="mt-2">
              Raccogliamo dati personali solo quando strettamente necessario,
              ad esempio:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                informazioni inserite nel form di contatto (nome, email,
                azienda, dettagli del progetto)
              </li>
              <li>
                dati scambiati via email durante la richiesta di preventivi o la
                gestione dei progetti
              </li>
              <li>
                eventuali iscrizioni a newsletter o aggiornamenti, se attivate
                in futuro
              </li>
              <li>
                informazioni tecniche e statistiche anonime sull&apos;uso del
                sito (ad esempio tramite strumenti di analytics)
              </li>
            </ul>
            <p className="mt-2">
              I dati vengono raccolti con il consenso dell&apos;utente e
              trattati in conformità alla normativa applicabile, incluso il
              GDPR, ove previsto.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              2. Utilizzo dei dati
            </h2>
            <p className="mt-2">
              I dati personali vengono utilizzati esclusivamente per:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                rispondere alle richieste di contatto e gestire la
                comunicazione sui progetti
              </li>
              <li>
                predisporre preventivi, tempistiche e documentazione legata ai
                servizi richiesti
              </li>
              <li>
                migliorare i nostri servizi e l&apos;esperienza di navigazione
                sul sito
              </li>
              <li>
                inviare comunicazioni o aggiornamenti solo previo consenso
                esplicito dell&apos;utente
              </li>
            </ul>
            <p className="mt-2">
              Non vendiamo i tuoi dati e non li condividiamo con terze parti,
              salvo quando richiesto dalla legge o quando necessario per erogare
              i servizi (ad esempio provider di email o hosting).
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              3. Conservazione e sicurezza
            </h2>
            <p className="mt-2">
              I dati personali sono conservati in modo sicuro e solo per il
              tempo necessario agli scopi indicati o per il periodo richiesto
              dalla legge. Adottiamo misure tecniche e organizzative adeguate
              per proteggere le informazioni da accessi non autorizzati,
              modifiche, divulgazioni o cancellazioni non consentite.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              4. Diritti dell&apos;utente
            </h2>
            <p className="mt-2">
              In base alla normativa applicabile, l&apos;utente può avere il
              diritto di:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>accedere ai dati personali che lo riguardano</li>
              <li>richiederne la rettifica o la cancellazione</li>
              <li>
                limitare o opporsi a determinati trattamenti dei propri dati
              </li>
              <li>
                revocare il consenso prestato in qualsiasi momento, ove
                rilevante
              </li>
              <li>
                richiedere la portabilità dei dati verso un altro titolare
              </li>
            </ul>
            <p className="mt-2">
              Per esercitare questi diritti è possibile contattarci all&apos;
              indirizzo{' '}
              <a
                href="mailto:office@nivello.it"
                className="text-emerald-300 hover:text-emerald-200"
              >
                office@nivello.it
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              5. Aggiornamenti della presente informativa
            </h2>
            <p className="mt-2">
              La presente informativa sulla privacy può essere aggiornata per
              riflettere cambiamenti normativi o modifiche nel modo in cui
              lavoriamo. La versione valida è sempre quella pubblicata su questa
              pagina.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}