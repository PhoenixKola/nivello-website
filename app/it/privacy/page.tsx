import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../../seo'

export const metadata: Metadata = pageSeo.privacyIt

export default function PrivacyPageIt() {
  return (
    <LegalPage
      locale="it"
      kind="privacy"
      label="Privacy Policy"
      title="Come trattiamo i tuoi dati."
      intro="Una panoramica chiara dei dati che raccogliamo, del motivo per cui li utilizziamo e delle scelte a tua disposizione."
    >
      <p>
        Nivello rispetta la privacy di visitatori e clienti e si impegna a proteggere i dati personali raccolti tramite questo sito e nell&apos;ambito delle collaborazioni professionali.
      </p>

      <section>
        <h2>1. Dati personali raccolti</h2>
        <p>Raccogliamo dati personali solo quando strettamente necessario, ad esempio:</p>
        <ul>
          <li>informazioni inserite nel form di contatto (nome, email, azienda, dettagli del progetto)</li>
          <li>dati scambiati via email durante la richiesta di preventivi o la gestione dei progetti</li>
          <li>eventuali iscrizioni a newsletter o aggiornamenti, se attivate in futuro</li>
          <li>informazioni tecniche e statistiche anonime sull&apos;uso del sito (ad esempio tramite strumenti di analytics)</li>
        </ul>
        <p>
          I dati vengono raccolti con il consenso dell&apos;utente e trattati in conformità alla normativa applicabile, incluso il GDPR, ove previsto.
        </p>
      </section>

      <section>
        <h2>2. Utilizzo dei dati</h2>
        <p>I dati personali vengono utilizzati esclusivamente per:</p>
        <ul>
          <li>rispondere alle richieste di contatto e gestire la comunicazione sui progetti</li>
          <li>predisporre preventivi, tempistiche e documentazione legata ai servizi richiesti</li>
          <li>migliorare i nostri servizi e l&apos;esperienza di navigazione sul sito</li>
          <li>inviare comunicazioni o aggiornamenti solo previo consenso esplicito dell&apos;utente</li>
        </ul>
        <p>
          Non vendiamo i tuoi dati e non li condividiamo con terze parti, salvo quando richiesto dalla legge o quando necessario per erogare i servizi (ad esempio provider di email o hosting).
        </p>
      </section>

      <section>
        <h2>3. Conservazione e sicurezza</h2>
        <p>
          I dati personali sono conservati in modo sicuro e solo per il tempo necessario agli scopi indicati o per il periodo richiesto dalla legge. Adottiamo misure tecniche e organizzative adeguate per proteggere le informazioni da accessi non autorizzati, modifiche, divulgazioni o cancellazioni non consentite.
        </p>
      </section>

      <section>
        <h2>4. Diritti dell&apos;utente</h2>
        <p>In base alla normativa applicabile, l&apos;utente può avere il diritto di:</p>
        <ul>
          <li>accedere ai dati personali che lo riguardano</li>
          <li>richiederne la rettifica o la cancellazione</li>
          <li>limitare o opporsi a determinati trattamenti dei propri dati</li>
          <li>revocare il consenso prestato in qualsiasi momento, ove rilevante</li>
          <li>richiedere la portabilità dei dati verso un altro titolare</li>
        </ul>
        <p>
          Per esercitare questi diritti è possibile contattarci all&apos;indirizzo <a href="mailto:office@nivello.it">office@nivello.it</a>.
        </p>
      </section>

      <section>
        <h2>5. Aggiornamenti della presente informativa</h2>
        <p>
          La presente informativa sulla privacy può essere aggiornata per riflettere cambiamenti normativi o modifiche nel modo in cui lavoriamo. La versione valida è sempre quella pubblicata su questa pagina.
        </p>
      </section>
    </LegalPage>
  )
}
