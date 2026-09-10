import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../../seo'

export const metadata: Metadata = pageSeo.disclaimerIt

export default function DisclaimerPageIt() {
  return (
    <LegalPage
      locale="it"
      kind="disclaimer"
      label="Disclaimer"
      title="Utilizzo di questo sito."
      intro="Le condizioni pratiche applicabili quando navighi sul sito Nivello e utilizzi le informazioni pubblicate."
    >
      <p>
        L&apos;accesso e l&apos;utilizzo di questo sito sono soggetti ai termini e alle condizioni riportati di seguito. Proseguendo nella navigazione, accetti tali condizioni.
      </p>

      <section>
        <h2>1. Scopo informativo e accuratezza dei contenuti</h2>
        <p>
          Le informazioni presenti su questo sito, incluse descrizioni dei servizi, processi, casi studio e disponibilità, hanno scopo puramente informativo e possono essere soggette a modifiche. Nonostante l&apos;impegno nel mantenere i contenuti aggiornati, non possiamo garantire che tutte le informazioni siano sempre complete o prive di errori. Nivello non si assume responsabilità per eventuali inesattezze o omissioni.
        </p>
      </section>

      <section>
        <h2>2. Modifiche ai servizi</h2>
        <p>
          Ci riserviamo il diritto di modificare, aggiornare o interrompere servizi, tariffe, modalità operative o disponibilità in qualsiasi momento e senza preavviso, al fine di garantire qualità e organizzazione del lavoro. Le condizioni specifiche concordate in preventivi o contratti con i singoli clienti prevalgono sulle informazioni generali pubblicate su questo sito.
        </p>
      </section>

      <section>
        <h2>3. Responsabilità limitata</h2>
        <p>
          Nivello non sarà responsabile per danni diretti o indiretti, perdite o inconvenienti derivanti dall&apos;uso di questo sito, dal fare affidamento sulle informazioni in esso contenute o dall&apos;impossibilità temporanea di accedere al sito. Nessun contenuto presente costituisce consulenza legale, finanziaria o professionale.
        </p>
      </section>

      <section>
        <h2>4. Link a siti di terze parti</h2>
        <p>
          Il sito può contenere collegamenti a siti esterni di terze parti. Tali link sono forniti solo per comodità. Nivello non ha controllo su tali siti e non è responsabile per i loro contenuti, la loro disponibilità o le relative pratiche in materia di privacy.
        </p>
      </section>

      <section>
        <h2>5. Proprietà intellettuale</h2>
        <p>
          Tutti i contenuti presenti su questo sito, inclusi testi, immagini, loghi e layout grafici, sono di proprietà di Nivello o dei rispettivi titolari dei diritti e sono protetti dalle normative vigenti in materia di diritto d&apos;autore e proprietà intellettuale. È vietato l&apos;utilizzo, la copia o la distribuzione di tali contenuti senza previa autorizzazione scritta.
        </p>
      </section>

      <section>
        <h2>6. Aggiornamenti del disclaimer</h2>
        <p>
          Nivello si riserva il diritto di aggiornare o modificare il presente disclaimer in qualsiasi momento. La versione valida è sempre quella pubblicata su questa pagina. Si consiglia di consultare periodicamente questa sezione per rimanere aggiornati su eventuali cambiamenti.
        </p>
      </section>
    </LegalPage>
  )
}
