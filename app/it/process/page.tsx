'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const steps = [
  {
    title: 'Chiamata conoscitiva',
    description: 'Parliamo del tuo brand, degli obiettivi, dei vincoli e di cosa significa un buon risultato nel tuo contesto.',
    clientView: 'Parli direttamente con le persone che lavoreranno al progetto, non con un commerciale. Ti diamo una prima idea di portata e tempi.',
    duration: '30–45 minuti',
    accent: 'emerald'
  },
  {
    title: 'Scope, piano e proposta',
    description: 'Definiamo deliverable, milestone e responsabilità perché tutti sappiano cosa succederà e quando.',
    clientView: 'Ricevi una proposta chiara da esaminare internamente, con timeline, investimento e punti di decisione.',
    duration: '3–5 giorni',
    accent: 'sky'
  },
  {
    title: 'Design e contenuti',
    description: 'Definiamo struttura, flussi e linguaggio visivo. Contenuti e copy vengono sviluppati in parallelo con il design.',
    clientView: 'Rivedi layout e schermate chiave in Figma, dai feedback mirati e vedi le iterazioni in tempi rapidi.',
    duration: '1–3 settimane a seconda del progetto',
    accent: 'fuchsia'
  },
  {
    title: 'Sviluppo e implementazione',
    description: 'Implementiamo i design approvati con strumenti front-end moderni, tenendo a mente performance e accessibilità.',
    clientView: 'Vedi anteprime regolari su un URL di staging e puoi testare l\'esperienza su desktop e mobile prima del lancio.',
    duration: '1–2 settimane per la maggior parte dei siti',
    accent: 'emerald'
  },
  {
    title: 'Lancio e ottimizzazione',
    description: 'Lanciamo il sito, monitoriamo le metriche principali e facciamo piccoli aggiustamenti basati sull\'utilizzo reale.',
    clientView: 'Ottieni un lancio stabile, documentazione degli aspetti essenziali e la possibilità di tenerci come partner per le iterazioni future.',
    duration: 'Prime 1–2 settimane dopo il lancio',
    accent: 'sky'
  }
]

const accentRing: Record<string, string> = {
  emerald: 'ring-emerald-300 bg-emerald-50 text-emerald-700 dark:ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'ring-sky-300 bg-sky-50 text-sky-700 dark:ring-sky-500/50 dark:bg-sky-500/15 dark:text-sky-300',
  fuchsia: 'ring-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:ring-fuchsia-500/50 dark:bg-fuchsia-500/15 dark:text-fuchsia-300'
}

const miniStepItems = [
  { label: 'Scoperta', icon: '🔍' },
  { label: 'Design', icon: '✏️' },
  { label: 'Sviluppo', icon: '⚡' },
  { label: 'Lancio', icon: '🚀' },
  { label: 'Ottimizzazione', icon: '📈' }
]

export default function ProcessPageIt() {
  return (
    <div className="bg-white dark:bg-ink">

      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/7 blur-[120px] dark:bg-sky-500/8" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] translate-x-1/3 -translate-y-1/3 rounded-full bg-fuchsia-400/6 blur-[100px] dark:bg-fuchsia-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Come lavoriamo</span>
              </div>

              <h1 className="mb-5 font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
                Un processo chiaro dalla{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 55%, #059669 100%)' }}>
                  prima idea
                </span>{' '}
                al lancio finale.
              </h1>

              <p className="mb-7 max-w-[480px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
                I dettagli di ogni progetto cambiano, ma il modo in cui collaboriamo rimane prevedibile. Nessuna call infinita, nessun passaggio di consegne caotico.
              </p>

              <Link href="/it/contact" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
                Inizia il processo
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="flex flex-col gap-3">
              {miniStepItems.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.35 + i * 0.1 }} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">0{i + 1}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.label}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <ol className="space-y-8 border-l-2 border-slate-200 pl-10 md:space-y-10 md:pl-12 dark:border-white/10">
            {steps.map((step, index) => (
              <motion.li key={step.title} className="relative" initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
                <div className={`absolute -left-[34px] mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 md:-left-10 ${accentRing[step.accent]}`}>
                  {index + 1}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
                  <div className="md:basis-1/2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{step.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{step.description}</p>
                  </div>
                  <div className="md:basis-1/2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Cosa vedi</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{step.clientView}</p>
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Durata indicativa: {step.duration}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white dark:bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Prossimo passo</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  Condividi un brief e mappiamo insieme il progetto.
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Non serve un documento perfetto. Bastano poche righe su brand, prodotto e obiettivi per cominciare.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link href="/it/contact" className="rounded-full bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
                  Inizia il processo
                </Link>
                <p className="text-xs text-slate-400 dark:text-slate-500">Di solito rispondiamo entro un giorno lavorativo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
