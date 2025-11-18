import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chi siamo | Nivello Studio',
  description:
    'Scopri Nivello Studio, studio digitale italiano specializzato in marketing, design e sviluppo front-end moderno.'
}

export default function ChiSiamoPageIt() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Chi siamo
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Uno studio compatto per brand attenti ai dettagli.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-5">
          <p>
            Nivello è uno studio digitale con base in Italia che aiuta
            le aziende a comunicare in modo chiaro e contemporaneo su tutti i
            canali. Uniamo strategia di marketing, design dell&apos;interfaccia
            e sviluppo front-end in un unico team, così non devi coordinare tre
            fornitori diversi.
          </p>
          <p>
            Lavoriamo soprattutto con founder, piccoli team e PMI strutturate
            che desiderano un partner diretto, senza troppi passaggi. Non ci
            sono strati di account: collabori con chi progetta e sviluppa
            realmente il sito.
          </p>
          <p>
            I progetti spaziano da siti marketing e landing page a interfacce
            per SaaS e front-end custom basati su React e Next.js. L&apos;obiettivo
            è sempre lo stesso: un risultato curato, veloce e allineato agli
            obiettivi di business.
          </p>
          <p>
            Gestiamo i lavori principalmente da remoto, con milestone chiare,
            anteprime in Figma e link di staging. Manteniamo la comunicazione
            strutturata e adatta al lavoro async, così puoi concentrarti sulle
            tue attività mentre il progetto avanza.
          </p>
          <p>
            Se stai cercando un partner di lungo periodo per design e sviluppo,
            che conosca sia il mercato italiano sia le aspettative
            internazionali, saremo felici di parlarne.
          </p>
        </div>
      </section>
    </main>
  )
}