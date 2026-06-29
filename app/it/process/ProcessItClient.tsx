'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Code2, Compass, FileText, Rocket, Sparkles } from 'lucide-react'
import FaqSection from '@/components/FaqSection'

const steps = [
  { title: 'Call introduttiva e fit check', description: 'Chiarifichiamo obiettivi, vincoli, tempi e cosa significa un buon risultato.', clientView: 'Una prima direzione di scope e la sensazione chiara che siamo il partner giusto o no.', duration: '30-45 minuti', icon: Compass, color: 'var(--brand-gold)' },
  { title: 'Scope, piano e proposta', description: 'Definiamo deliverable, milestone, responsabilita e punti decisionali.', clientView: 'Una proposta con timeline, investimento e prossimi passi pratici.', duration: '3-5 giorni', icon: FileText, color: 'var(--brand-blue)' },
  { title: 'Design e contenuti', description: 'Costruiamo struttura, flussi, direzione visiva e messaggi principali delle pagine.', clientView: 'Layout e schermate chiave da revisionare, con feedback mirato.', duration: '1-3 settimane', icon: Sparkles, color: 'var(--brand-purple)' },
  { title: 'Sviluppo e implementazione', description: 'Implementiamo la direzione approvata con attenzione a performance e accessibilita.', clientView: 'Una preview staging da testare su desktop e mobile.', duration: '1-2 settimane', icon: Code2, color: 'var(--brand-pink)' },
  { title: 'Lancio e miglioramento', description: 'Lanciamo, controlliamo gli elementi essenziali e rifiniamo i dettagli in base all’uso reale.', clientView: 'Una release stabile, documentazione essenziale e una strada per iterazioni future.', duration: 'Prime 1-2 settimane dopo il lancio', icon: Rocket, color: 'var(--brand-gold)' }
]

export default function ProcessItClient() {
  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_0.48fr] lg:items-center lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Metodo</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Un processo chiaro dalla <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">prima idea</span> al lancio.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              I dettagli cambiano da progetto a progetto, ma la collaborazione resta prevedibile. Fasi chiare, checkpoint mirati e nessun passaggio caotico.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Ritmo progetto</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Primi checkpoint</p>
              </div>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:text-slate-400">Preview</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {steps.slice(0, 3).map((step, index) => (
                <div key={step.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/45">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">0{index + 1}</span>
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                    </div>
                    <p className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">{step.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <ol className="relative space-y-6 before:absolute before:left-5 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-slate-200 md:before:left-1/2 dark:before:bg-slate-700/70">
            {steps.map((step, index) => (
              <motion.li key={step.title} className={`relative grid gap-4 md:grid-cols-2 md:gap-10 ${index % 2 === 0 ? '' : 'md:[&>article]:col-start-2'}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.06 }}>
                <div className="absolute left-5 top-6 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-white shadow-sm md:left-1/2 dark:border-slate-900 dark:bg-slate-900">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: step.color }} />
                </div>
                <article className="ml-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:ml-0 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                      <step.icon className="h-5 w-5" style={{ color: step.color }} />
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{step.duration}</span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{index + 1}</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{step.description}</p>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: step.color }} />
                    {step.clientView}
                  </p>
                </article>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection locale="it" />
    </main>
  )
}
