'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    question: 'Quanto dura in media un progetto di sito web?',
    answer:
      'La maggior parte dei progetti dura tra le due e le sei settimane, in base a contenuti, complessità e velocità di feedback.'
  },
  {
    question: 'Lavorate solo con aziende italiane?',
    answer:
      'Siamo basati in Italia ma lavoriamo con clienti in tutta Europa. Possiamo comunicare in italiano o in inglese.'
  },
  {
    question: 'Potete aiutarci anche con i testi, non solo con il design?',
    answer:
      'Sì. Spesso lavoriamo su struttura, messaggi e microcopy per allineare i contenuti al design e agli obiettivi.'
  },
  {
    question: 'Come funziona la collaborazione nel concreto, settimana per settimana?',
    answer:
      'Definiamo prima un piano, con milestone e momenti di revisione. Ricevi aggiornamenti async chiari, senza call infinite.'
  }
]

export default function FaqSectionIt() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  return (
    <section className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            FAQ
          </p>
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Le domande che ci fanno più spesso.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Se non trovi qui la risposta che cerchi, scrivici un messaggio
            breve e ti risponderemo direttamente.
          </p>
        </div>

        <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/80">
          {faqs.map((item, index) => {
            const isOpen = index === activeIndex
            const isFirst = index === 0
            const isLast = index === faqs.length - 1

            const roundedHover = isFirst
              ? 'hover:rounded-t-2xl'
              : isLast
              ? 'hover:rounded-b-2xl'
              : ''

            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(prev => (prev === index ? null : index))
                  }
                  className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm text-slate-100 hover:bg-slate-900/80 md:px-5 ${roundedHover}`}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-slate-300 md:px-5">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Hai ancora dubbi?{' '}
          <Link
            href="/it/contact"
            className="text-emerald-300 hover:text-emerald-200"
          >
            Inviaci un messaggio veloce
          </Link>{' '}
          e ti diremo se siamo il partner giusto per il tuo progetto.
        </p>
      </div>
    </section>
  )
}