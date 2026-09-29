import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.termsIt

export default function TerminiPage() {
  return (
    <LegalPage
      locale="it"
      kind="terms"
      label="Termini e condizioni"
      title="Lavorare insieme, con chiarezza."
      intro="Le condizioni generali per i siti, le app web e gli altri progetti digitali realizzati da Nivello."
    >
      <p>
        Questi termini descrivono come lavoriamo con i clienti. Il preventivo o l’accordo di progetto accettato per iscritto definisce attività, prezzo e tempistiche specifiche. In caso di differenze, prevale quell’accordo.
      </p>

      <section>
        <h2>1. Ambito del progetto</h2>
        <p>Prima di iniziare concordiamo risultati da consegnare, tempistiche, revisioni ed eventuali servizi come hosting o manutenzione. Le attività fuori dall’ambito concordato vengono valutate e approvate separatamente.</p>
      </section>

      <section>
        <h2>2. Collaborazione</h2>
        <p>Il cliente fornisce contenuti, accessi, decisioni e feedback necessari per procedere. Se un elemento arriva in ritardo o cambia l’ambito del progetto, discutiamo gli effetti su tempi e costi prima di proseguire.</p>
      </section>

      <section>
        <h2>3. Compensi e pagamenti</h2>
        <p>Importi, fasi di pagamento e scadenze sono indicati nel preventivo accettato o nella fattura. Le attività aggiuntive vengono preventivate e concordate prima di essere incluse nel progetto.</p>
      </section>

      <section>
        <h2>4. Contenuti e diritti</h2>
        <p>Il cliente conserva i diritti sui materiali che fornisce e conferma di poterli utilizzare nel progetto. I diritti sui risultati finali sono definiti nell’accordo di progetto. Font, software, immagini e servizi di terzi restano soggetti alle rispettive licenze e condizioni.</p>
      </section>

      <section>
        <h2>5. Riservatezza e portfolio</h2>
        <p>Trattiamo come riservate le informazioni di progetto non pubbliche. Possiamo mostrare nel portfolio i lavori pubblicati, i nomi e i loghi dei clienti quando l’accordo di progetto o il cliente lo consentono. I marchi restano di proprietà dei rispettivi titolari.</p>
      </section>

      <section>
        <h2>6. Pubblicazione e servizi continuativi</h2>
        <p>Supporto al lancio, hosting, manutenzione e assistenza continuativa sono inclusi solo se previsti nell’ambito concordato. Le piattaforme e i fornitori esterni possono applicare condizioni proprie.</p>
      </section>

      <section>
        <h2>7. Modifiche, pause e problemi</h2>
        <p>Se un progetto viene sospeso o annullato, l’accordo accettato stabilisce come gestire il lavoro svolto e i pagamenti. Ti invitiamo a segnalarci tempestivamente eventuali problemi per trovare una soluzione pratica. Restano fermi i diritti inderogabili previsti dalla legge applicabile.</p>
      </section>

      <section>
        <h2>8. Contatti e aggiornamenti</h2>
        <p>Per domande su questi termini scrivi a <a href="mailto:office@nivello.it">office@nivello.it</a>. Possiamo aggiornare questa pagina per i progetti futuri; le modifiche non cambiano gli accordi scritti già in essere.</p>
      </section>
    </LegalPage>
  )
}
