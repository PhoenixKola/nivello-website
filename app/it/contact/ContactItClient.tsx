'use client'

import { motion } from 'framer-motion'
import { Globe2, Mail, MapPin } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

export default function ContactItClient() {
  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Contatti</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Raccontaci cosa vuoi <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">costruire.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Ti aiutiamo a definire il prossimo passo. Raccontaci il brand, gli obiettivi e le tempistiche. Di solito rispondiamo entro un giorno lavorativo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { icon: MapPin, label: 'Basati in Italia' },
                { icon: Globe2, label: 'Attivi in Europa' },
                { icon: Mail, label: 'office@nivello.it' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <item.icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] md:py-28">
          <ContactForm locale="it" />

          <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="h-fit rounded-2xl border border-slate-200 bg-stone-50 p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">Un buon primo messaggio include</p>
            <ul className="mt-4 space-y-3 text-slate-500 dark:text-slate-300">
              <li>Il sito o link del brand, se esiste.</li>
              <li>L&apos;obiettivo business dietro il progetto.</li>
              <li>Scadenze, date di lancio o vincoli interni.</li>
              <li>Cosa e gia chiaro e cosa e ancora confuso.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email diretta</p>
              <a href="mailto:office@nivello.it" className="mt-1 inline-flex text-sm font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">office@nivello.it</a>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  )
}
