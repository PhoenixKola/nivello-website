'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import BottomCtaIt from '@/components/BottomCtaIt'

const projects = [
  {
    href: 'https://rombonord.com/it/',
    category: 'Ristorazione · Ristorante e Cocktail Bar',
    title: 'Rombo Nord · Genova Pegli',
    desc: 'Sito bilingue per uno storico ristorante e cocktail bar sul mare a Pegli, con percorsi chiari verso menu, eventi e prenotazioni.',
    details: ['Menu drink e ristorante separati', 'Flusso di prenotazione online', 'Visual atmosferici coerenti con il brand'],
    accent: 'emerald',
    linkText: 'Visita il sito ↗'
  },
  {
    href: 'https://le-camelie.com/',
    category: 'Ospitalità · Sito per B&B',
    title: 'Le Camelie · Camere a Genova',
    desc: 'Sito compatto per un B&B nel centro di Genova, pensato per la chiarezza, i dettagli del soggiorno e le conversioni al motore di prenotazione.',
    details: ['Gallerie camere e panoramica dei servizi', 'Layout orientato alla fiducia con recensioni', 'CTA chiare verso il sistema di prenotazione'],
    accent: 'sky',
    linkText: 'Visita il sito ↗'
  },
  {
    href: 'https://gjergj-jozef-kola.com/',
    category: 'Editoria · Portfolio autore',
    title: 'Gjergj Jozef Kola · Sito autore',
    desc: 'Sito multilingue per un autore con piccolo shop, che presenta libri, biografia e contatti in un layout letterario e sobrio.',
    details: ['Presentazione autore e libri in evidenza', 'Pagine libro pronte per e-commerce', 'Contatto per lettori e media'],
    accent: 'fuchsia',
    linkText: 'Visita il sito ↗'
  },
  {
    href: 'https://consteam.eu/',
    category: 'Impresa locale · Pulizie e manutenzione',
    title: 'Consteam · Pulizie e Manutenzione',
    desc: 'Sito multi-pagina per una ditta di pulizie e manutenzione, con enfasi su servizi, contatto e segnali di fiducia per i clienti.',
    details: ['Panoramica servizi con sezioni dedicate', 'Form di contatto e flusso richiesta semplice', 'Layout professionale per B2B e B2C'],
    accent: 'emerald',
    linkText: 'Visita il sito ↗'
  },
  {
    href: 'https://yourassistinitaly.it/',
    category: 'Servizi per expat · Consulenza immigrazione',
    title: 'Your Assist in Italy · Firenze',
    desc: 'Sito bilingue per una consulenza immigrazione con sede a Firenze, che aiuta gli expat a gestire permessi, partite IVA e autorizzazioni lavorative.',
    details: ['Pagine servizi in italiano e inglese', 'Prezzi chiari e percorso di prenotazione consulenza', 'Layout orientato alla fiducia con FAQ e testimonianze'],
    accent: 'sky',
    linkText: 'Visita il sito ↗'
  }
]

const accentStyles: Record<string, { hover: string; text: string; dot: string }> = {
  emerald: { hover: 'hover:border-emerald-300 hover:shadow-emerald-500/10 dark:hover:border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
  sky: { hover: 'hover:border-sky-300 hover:shadow-sky-500/10 dark:hover:border-sky-500/40', text: 'text-sky-600 dark:text-sky-300', dot: 'bg-sky-500' },
  fuchsia: { hover: 'hover:border-fuchsia-300 hover:shadow-fuchsia-500/10 dark:hover:border-fuchsia-500/40', text: 'text-fuchsia-600 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' }
}

export default function WorkPageIt() {
  return (
    <div className="bg-white dark:bg-slate-950">

      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-sky-400/8 blur-[130px] dark:bg-sky-500/10" />
          <div className="absolute left-1/4 bottom-0 h-[400px] w-[400px] translate-y-1/4 rounded-full bg-fuchsia-400/6 blur-[100px] dark:bg-fuchsia-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-20 md:py-28">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">I nostri lavori</span>
              </div>

              <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3rem] dark:text-slate-50">
                Lavori selezionati costruiti per{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 55%, #db2777 100%)' }}>
                  essere nitidi
                </span>{' '}
                e performanti.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
                Progetti reali nel settore hospitality, editoria, servizi locali e consulenza. Ogni sito progettato e sviluppato da Nivello, dalla strategia al lancio.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {projects.map((p, i) => {
                const s = accentStyles[p.accent]
                return (
                  <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className={`mb-1.5 h-1.5 w-8 rounded-full ${s.dot}`} />
                    <p className="text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-200">{p.title.split('·')[0].trim()}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{p.category.split('·')[0].trim()}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3 md:py-16">
          {projects.map((p, i) => {
            const s = accentStyles[p.accent]
            return (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <Link href={p.href} target="_blank" rel="noopener noreferrer" className={`flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950/90 ${s.hover}`}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.category}</p>
                    <h2 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.title}</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{p.desc}</p>
                    <ul className="mt-3 space-y-1">
                      {p.details.map(d => (
                        <li key={d} className="flex items-start gap-1.5 text-xs text-slate-400">
                          <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${s.dot} opacity-60`} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className={`mt-4 text-xs font-medium ${s.text}`}>{p.linkText}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <BottomCtaIt />
    </div>
  )
}
