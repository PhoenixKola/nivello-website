'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Marco B.',
    role: 'Titolare, boutique hotel in Toscana',
    quote:
      'Nivello ci ha dato un sito moderno e una storia più chiara. Ora siamo felici di condividere il link con gli ospiti.',
    detail:
      'Le prenotazioni dirette sono aumentate e i clienti internazionali capiscono subito l’offerta.'
  },
  {
    name: 'Elena R.',
    role: 'Responsabile marketing, piattaforma SaaS',
    quote:
      'Hanno tradotto un prodotto complesso in un racconto semplice. Le richieste demo sono più qualificate.',
    detail:
      'Il nuovo sito parla ai decisori non tecnici senza banalizzare il prodotto.'
  },
  {
    name: 'Luca P.',
    role: 'Founder, studio creativo',
    quote:
      'Comunicazione chiara, rispetto delle scadenze e scelte di design sempre motivate.',
    detail:
      'Sembrava di lavorare con un team interno di prodotto più che con un’agenzia esterna.'
  }
]

export default function TestimonialsSectionIt() {
  return (
    <section className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Testimonianze
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              I team che lavorano con noi tendono a tornare.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Nomi e dettagli sono leggermente anonimizzati, ma situazioni e
              risultati sono reali.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-md shadow-emerald-500/30"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <blockquote className="text-sm text-slate-200">
                “{t.quote}”
              </blockquote>
              <p className="mt-3 text-xs text-slate-400">{t.detail}</p>
              <figcaption className="mt-4 text-sm text-slate-100">
                {t.name}
                <span className="block text-xs text-slate-400">{t.role}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}