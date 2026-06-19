'use client'

import { motion } from 'framer-motion'
import { Check, Code2, Compass, Megaphone, Palette } from 'lucide-react'

const serviceCards = [
  {
    label: 'Strategia',
    title: 'Strategia',
    desc: 'Posizionamento, struttura dell\'offerta e piano pratico prima del design.',
    items: ['Chiarezza su pubblico e offerta', 'Struttura e priorita del sito', 'Mappatura del percorso di conversione', 'Piano di lancio e prossimi passi'],
    ideal: 'Ideale quando il business ha bisogno di una direzione piu chiara.',
    icon: Compass,
    color: 'var(--brand-gold)'
  },
  {
    label: 'Marketing',
    title: 'Marketing',
    desc: 'Messaggi e logica di campagna per trasformare attenzione in contatti qualificati.',
    items: ['Landing page e sales page', 'Messaggi e microcopy', 'Idee per lead magnet ed email flow', 'Setup base di analytics e tracking'],
    ideal: 'Ideale per lanci, lead generation e offerte piu leggibili.',
    icon: Megaphone,
    color: 'var(--brand-blue)'
  },
  {
    label: 'Design',
    title: 'Brand e product design',
    desc: 'Visual puliti e contemporanei, adatti al mercato italiano ed europeo.',
    items: ['Look and feel del brand', 'UI design per siti e app', 'Design system e componenti', 'Asset visual per marketing'],
    ideal: 'Ideale per SaaS, agenzie e aziende di servizi.',
    icon: Palette,
    color: 'var(--brand-purple)'
  },
  {
    label: 'Sviluppo',
    title: 'Sviluppo e implementazione',
    desc: 'Siti veloci e SEO-friendly, costruiti con attenzione alla manutenzione.',
    items: ['Siti corporate e landing page', 'Frontend custom React e Next.js', 'Integrazione headless CMS su richiesta', 'Controlli performance e accessibilita'],
    ideal: 'Ideale quando vuoi un partner tecnico nel tempo.',
    icon: Code2,
    color: 'var(--brand-blue)'
  }
]

export default function ServicesItClient() {
  return (
    <main className="bg-white dark:bg-ink">
      <section className="relative overflow-hidden border-b border-slate-100 bg-stone-50 dark:border-white/10 dark:bg-ink">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_0.48fr] lg:items-center lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Servizi</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Tutto cio che serve alla tua presenza digitale, dalla <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">strategia al lancio.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Dalla prima impressione alla conversione finale, progettiamo e costruiamo l&apos;intero percorso digitale. Uno studio, un team, nessun passaggio complicato.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Studio stack</p>
            <div className="mt-5 space-y-3">
              {serviceCards.map(service => (
                <div key={service.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-950/50">
                  <service.icon className="h-4 w-4" style={{ color: service.color }} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{service.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">Cosa facciamo</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Quattro servizi collegati, un workflow pulito.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {serviceCards.map((s, i) => (
              <motion.article key={s.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{s.desc}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-5 text-xs font-medium text-slate-500 dark:text-slate-400">{s.ideal}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
