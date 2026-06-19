'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Eduard',
    role: 'Titolare, ristorante Rombo Nord',
    avatar: 'bg-[var(--brand-gold)] text-slate-950',
    quote: 'Nivello ci ha dato un sito moderno e una storia più chiara. Ora siamo felici di condividere il link con gli ospiti.',
    detail: 'Le prenotazioni dirette sono aumentate e i clienti internazionali capiscono subito l\'offerta.'
  },
  {
    name: 'Camelie',
    role: 'Titolare, guesthouse Le Camelie',
    avatar: 'bg-[var(--brand-blue)] text-white',
    quote: 'Hanno tradotto un prodotto complesso in un racconto semplice. Le richieste risultano più qualificate.',
    detail: 'Il nuovo sito parla ai visitatori in modo chiaro, senza perdere credibilità o dettaglio.'
  },
  {
    name: 'Gjergj',
    role: 'Autore, sito portfolio',
    avatar: 'bg-[var(--brand-purple)] text-white',
    quote: 'Comunicazione chiara, rispetto delle scadenze e scelte di design sempre motivate.',
    detail: 'Sembrava di lavorare con un piccolo team interno più che con un fornitore esterno.'
  },
  {
    name: 'Consteam',
    role: 'Studio di consulenza e ingegneria',
    avatar: 'bg-[var(--brand-gold)] text-slate-950',
    quote: 'Ci serviva un sito pulito, professionale e facile da aggiornare: il risultato rispecchia esattamente chi siamo.',
    detail: 'Struttura chiara dei servizi, immagine più coerente e una presenza online finalmente allineata al nostro posizionamento.'
  },
  {
    name: 'Davide',
    role: 'Fondatore, Your Assist in Italy',
    avatar: 'bg-[#DC2626] text-white',
    quote: 'Nivello ha reso chiari i nostri servizi in modo immediato. I clienti internazionali ora capiscono cosa facciamo prima ancora di prenotare una consulenza.',
    detail: 'La struttura del sito e i testi hanno cambiato la percezione che gli expat hanno di noi: professionali, accessibili e affidabili.'
  }
]

const clients = ['Rombo Nord', 'Le Camelie', 'Your Assist in Italy', 'Consteam', 'Gjergj Jozef Kola']

function Stars() {
  return (
    <div className="mb-4 flex gap-0.5 text-amber-400" aria-label="5 stelle su 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSectionIt() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              Testimonianze
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              I team che lavorano con noi tendono a tornare.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Nomi e dettagli sono leggermente anonimizzati, ma situazioni e risultati sono reali.
            </p>
          </div>
        </div>

        {/* Striscia di fiducia clienti */}
        <div className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-slate-200/70 py-5 dark:border-white/10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Hanno scelto Nivello</span>
          {clients.map(c => (
            <span key={c} className="font-display text-base font-medium text-slate-500 dark:text-slate-300/70">{c}</span>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20 dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.22)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div>
                <Stars />
                <blockquote className="text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-200">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <p className="mt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{t.detail}</p>
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.avatar} text-sm font-semibold shadow-sm`}>
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
