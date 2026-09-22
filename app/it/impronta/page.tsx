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
      intro="Il nome dello studio e i contatti relativi a questo sito."
    >
      <p>
        Nivello è uno studio digitale che sviluppa siti e app web per le aziende. Per domande su questo sito o sui nostri servizi puoi contattarci ai recapiti qui sotto.
      </p>

      <section>
        <h2>Nivello</h2>
        <p>Denominazione: Nivello</p>
      </section>

      <section>
        <h2>Contatto</h2>
        <p>Email: <a href="mailto:office@nivello.it">office@nivello.it</a></p>
      </section>
    </LegalPage>
  )
}
