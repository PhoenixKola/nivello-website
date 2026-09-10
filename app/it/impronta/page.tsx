import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pageSeo } from '../../seo'

export const metadata: Metadata = pageSeo.imprintIt

export default function ImprontaPageIt() {
  return (
    <LegalPage
      locale="it"
      kind="imprint"
      label="Impronta"
      title="Informazioni legali."
      intro="Le principali informazioni aziendali, di contatto e sulla risoluzione delle controversie pubblicate da Nivello."
    >
      <p>
        In questa pagina trovi i principali dati legali di Nivello. Prima di pubblicare il sito, sostituisci i seguenti campi con i dati ufficiali della tua attività.
      </p>

      <section>
        <h2>Nivello</h2>
        <p>Denominazione: Nivello</p>
        {/* <p>Indirizzo sede: [Indirizzo completo, città, paese]</p>
        <p>Titolare / legale rappresentante: [Nome o ragione sociale]</p>
        <p>Registro imprese: [Città e numero di iscrizione]</p>
        <p>Partita IVA: [Inserisci la tua Partita IVA]</p> */}
      </section>

      <section>
        <h2>Risoluzione alternativa delle controversie</h2>
        <p>
          La piattaforma ODR europea è stata dismessa il 20 luglio 2025. La Commissione Europea pubblica informazioni aggiornate per i consumatori sulla risoluzione alternativa delle controversie al seguente link:{' '}
          <a href="https://commission.europa.eu/topics/consumers/consumer-rights-and-complaints/resolve-your-consumer-complaint/alternative-dispute-resolution-consumers_it" target="_blank" rel="noreferrer">Portale ADR della Commissione Europea</a>.
        </p>
        <p>
          Non siamo obbligati a partecipare a una procedura di risoluzione delle controversie davanti a un organismo di conciliazione per i consumatori, ma siamo generalmente disponibili a farlo qualora non sia possibile trovare una soluzione amichevole in altro modo.
        </p>
      </section>

      <section>
        <h2>Contatto</h2>
        <p>Email: <a href="mailto:office@nivello.it">office@nivello.it</a></p>
      </section>
    </LegalPage>
  )
}
