'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

const faqs = [
  {
    question: 'Quanto dura in media un progetto di sito web?',
    answer: 'La maggior parte dei progetti dura tra le due e le sei settimane, in base a contenuti, complessita e velocita di feedback.'
  },
  {
    question: 'Lavorate solo con aziende italiane?',
    answer: 'Siamo basati in Italia ma lavoriamo con clienti in tutta Europa. Possiamo comunicare in italiano o in inglese.'
  },
  {
    question: 'Potete aiutarci anche con i testi, non solo con il design?',
    answer: 'Si. Spesso lavoriamo su struttura, messaggi e microcopy per allineare i contenuti al design e agli obiettivi.'
  },
  {
    question: 'Come funziona la collaborazione nel concreto, settimana per settimana?',
    answer: 'Definiamo prima un piano, con milestone e momenti di revisione. Ricevi aggiornamenti async chiari, senza call infinite.'
  }
]

export default function FaqSectionIt() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            FAQ
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
            Le domande che ci fanno piu spesso.
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
            Se non trovi qui la risposta che cerchi, scrivici un messaggio breve e ti risponderemo direttamente.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_16px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
          {faqs.map((item, index) => {
            const isOpen = index === activeIndex
            const isLast = index === faqs.length - 1

            return (
              <div key={item.question} className={!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(prev => (prev === index ? null : index))}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors ${
                    isOpen
                      ? 'bg-white text-slate-900 dark:bg-slate-900/60 dark:text-slate-50'
                      : 'text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-slate-50'
                  }`}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isOpen
                        ? 'border-[var(--brand-gold)] text-[var(--brand-gold)]'
                        : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-3">
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Hai ancora dubbi?{' '}
          <Link href="/it/contact" className="text-[var(--brand-blue)] hover:text-blue-500 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300">
            Inviaci un messaggio veloce
          </Link>{' '}
          e ti diremo se siamo il partner giusto per il tuo progetto.
        </p>
      </div>
    </section>
  )
}
