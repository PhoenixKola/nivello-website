import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | Nivello',
  description:
    'Disclaimer per l’utilizzo del sito web di Nivello e delle informazioni in esso contenute.'
}

export default function DisclaimerPageIt() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Disclaimer
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Utilizzo di questo sito.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-6">
          <p>
            L&apos;accesso e l&apos;utilizzo di questo sito sono soggetti ai
            termini e alle condizioni riportati di seguito. Proseguendo nella
            navigazione, accetti tali condizioni.
          </p>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              1. Scopo informativo e accuratezza dei contenuti
            </h2>
            <p className="mt-2">
              Le informazioni presenti su questo sito, incluse descrizioni dei
              servizi, processi, casi studio e disponibilità, hanno scopo
              puramente informativo e possono essere soggette a modifiche.
              Nonostante l&apos;impegno nel mantenere i contenuti aggiornati, non
              possiamo garantire che tutte le informazioni siano sempre complete
              o prive di errori. Nivello non si assume responsabilità per
              eventuali inesattezze o omissioni.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              2. Modifiche ai servizi
            </h2>
            <p className="mt-2">
              Ci riserviamo il diritto di modificare, aggiornare o interrompere
              servizi, tariffe, modalità operative o disponibilità in qualsiasi
              momento e senza preavviso, al fine di garantire qualità e
              organizzazione del lavoro. Le condizioni specifiche concordate in
              preventivi o contratti con i singoli clienti prevalgono sulle
              informazioni generali pubblicate su questo sito.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              3. Responsabilità limitata
            </h2>
            <p className="mt-2">
              Nivello non sarà responsabile per danni diretti o
              indiretti, perdite o inconvenienti derivanti dall&apos;uso di
              questo sito, dal fare affidamento sulle informazioni in esso
              contenute o dall&apos;impossibilità temporanea di accedere al
              sito. Nessun contenuto presente costituisce consulenza legale,
              finanziaria o professionale.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              4. Link a siti di terze parti
            </h2>
            <p className="mt-2">
              Il sito può contenere collegamenti a siti esterni di terze parti.
              Tali link sono forniti solo per comodità. Nivello non ha
              controllo su tali siti e non è responsabile per i loro contenuti,
              la loro disponibilità o le relative pratiche in materia di
              privacy.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              5. Proprietà intellettuale
            </h2>
            <p className="mt-2">
              Tutti i contenuti presenti su questo sito, inclusi testi, immagini,
              loghi e layout grafici, sono di proprietà di Nivello o dei
              rispettivi titolari dei diritti e sono protetti dalle normative
              vigenti in materia di diritto d&apos;autore e proprietà
              intellettuale. È vietato l&apos;utilizzo, la copia o la
              distribuzione di tali contenuti senza previa autorizzazione
              scritta.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              6. Aggiornamenti del disclaimer
            </h2>
            <p className="mt-2">
              Nivello si riserva il diritto di aggiornare o modificare il
              presente disclaimer in qualsiasi momento. La versione valida è
              sempre quella pubblicata su questa pagina. Si consiglia di
              consultare periodicamente questa sezione per rimanere aggiornati
              su eventuali cambiamenti.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}