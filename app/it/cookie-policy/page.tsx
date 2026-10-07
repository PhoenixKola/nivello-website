import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.cookiesIt

export default function CookiePolicyPageIt() {
  return (
    <LegalPage
      locale="it"
      kind="cookies"
      label="Cookie policy"
      title="Cookie e memorizzazione nel browser."
      intro="Cosa memorizza questo sito nel tuo browser, perché e come puoi controllarlo. Descriviamo ciò che il sito fa realmente oggi."
    >
      <section>
        <h2>1. In breve</h2>
        <p>
          Il sito pubblico di Nivello non installa cookie pubblicitari, di profilazione o di tracciamento di terze parti e non carica analytics di terze parti, widget social o script pubblicitari. Utilizza solo strumenti di memorizzazione tecnici necessari al funzionamento del sito e statistiche aggregate di prima parte che non usano cookie. Per questo non viene richiesto alcun consenso; alla prima visita un breve avviso ti informa di questa impostazione.
        </p>
      </section>

      <section>
        <h2>2. Cosa viene memorizzato nel browser</h2>
        <ul>
          <li>
            <strong>theme</strong> (local storage) — ricorda se hai scelto il tema chiaro o scuro. Tecnico; resta finché non lo cancelli.
          </li>
          <li>
            <strong>nv_privacy_notice</strong> (local storage) — ricorda che hai chiuso l&apos;avviso privacy, così non viene mostrato su ogni pagina. Tecnico; resta finché non lo cancelli.
          </li>
          <li>
            <strong>nv_sid</strong> e <strong>nv_once_*</strong> (session storage) — un identificativo casuale e alcuni indicatori usati solo per contare in forma aggregata visite e passaggi di conversione (ad esempio quante visite arrivano al form di contatto). Esistono solo per la scheda corrente e vengono eliminati alla sua chiusura.
          </li>
          <li>
            <strong>Introduzione della homepage</strong> (session storage) — ricorda che l&apos;animazione della homepage è già stata mostrata in questa scheda. Viene eliminata alla chiusura della scheda.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Statistiche aggregate</h2>
        <p>
          Le statistiche sono raccolte direttamente da Nivello e conservate sul nostro server. Registriamo percorsi delle pagine, siti di provenienza, tipo di dispositivo, lingua e un paese approssimativo (ricavato dall&apos;indirizzo di rete tramite un database sul nostro server, oppure dal fuso orario del browser). L&apos;identificativo casuale della scheda viene conservato sul nostro server solo per contare le visite uniche giornaliere. Gli indirizzi IP non vengono memorizzati a fini statistici; per proteggere il servizio da abusi, un hash con sale dell&apos;indirizzo di rete viene conservato per pochi minuti e rinnovato ogni giorno. Non creiamo profili individuali e non incrociamo questi dati con altre fonti né li condividiamo con terzi. Se il browser invia i segnali Do Not Track o Global Privacy Control, nessuna statistica viene raccolta.
        </p>
      </section>

      <section>
        <h2>4. Servizi di terze parti</h2>
        <p>
          Quando invii il form di contatto, i dati inseriti vengono trasmessi a Formspree, il servizio che ce li recapita via email. Nulla viene inviato a Formspree prima dell&apos;invio del form. I link ai siti dei clienti nel nostro portfolio aprono quei siti, che applicano le proprie cookie policy.
        </p>
      </section>

      <section>
        <h2>5. Le tue scelte</h2>
        <p>
          Puoi cancellare in qualsiasi momento local storage e session storage dalle impostazioni del browser e attivare Do Not Track o Global Privacy Control per disattivare del tutto le statistiche. Poiché non vengono usati cookie non necessari, non c&apos;è alcun consenso da prestare o revocare. Se questo dovesse cambiare, aggiorneremo questa pagina e chiederemo il tuo consenso prima di attivare qualsiasi strumento non necessario.
        </p>
        <p>
          Questa informativa segue le Linee guida del Garante per la protezione dei dati personali su cookie e altri strumenti di tracciamento. Per qualsiasi domanda scrivi a <a href="mailto:office@nivello.it">office@nivello.it</a>. Maggiori dettagli sul trattamento dei dati personali sono nella <a href="/it/privacy/">Privacy policy</a>.
        </p>
      </section>
    </LegalPage>
  )
}
