'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const values = [
  {
    icon: '🤝',
    title: 'Collaborazione diretta',
    desc: 'Lavori con le persone che progettano e costruiscono il tuo sito — nessun account manager, nessun livello intermedio.'
  },
  {
    icon: '🧩',
    title: 'Un team, tutto il servizio',
    desc: 'Strategia, design e sviluppo sotto lo stesso tetto. Nessun fornitore frammentato, nessun overhead di comunicazione.'
  },
  {
    icon: '🌍',
    title: 'Competenza sul mercato italiano',
    desc: 'Conosciamo le aspettative locali, gli standard visivi e le norme comunicative che le agenzie generiche ignorano.'
  }
]

export default function ChiSiamoPageIt() {
  return (
    <main className="bg-white dark:bg-ink">

      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/4 rounded-full bg-fuchsia-400/6 blur-[130px] dark:bg-fuchsia-500/8" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-400/6 blur-[100px] dark:bg-emerald-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Chi siamo</span>
              </div>

              <h1 className="mb-5 font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
                Uno studio digitale focalizzato che aiuta i brand ad apparire{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #c026d3 0%, #0284c7 55%, #059669 100%)' }}>
                  più credibili
                </span>{' '}
                online.
              </h1>

              <p className="mb-7 max-w-[500px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
                Uniamo strategia di marketing, design dell&apos;interfaccia e sviluppo front-end in un team compatto — così ottieni un risultato coerente senza gestire più fornitori.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/it/contact" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
                  Contattaci
                </Link>
                <Link href="/it/work" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-slate-100">
                  Guarda i nostri lavori →
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="flex flex-col gap-3">
              {values.map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-xl">{v.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-ink">
        <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-5 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
            <p>
              Nivello è uno studio digitale compatto con sede in Italia, focalizzato ad aiutare le aziende a comunicare con chiarezza e ad apparire moderne in ogni touchpoint. Uniamo strategia di marketing, design di interfaccia e sviluppo front-end in un unico posto, così non devi gestire tre fornitori diversi.
            </p>
            <p>
              Lavoriamo principalmente con fondatori, piccoli team e PMI consolidate che vogliono un partner con cui parlare direttamente. Nessun livello di account manager — collabori con le persone che progettano e costruiscono effettivamente il tuo sito.
            </p>
            <p>
              Il nostro lavoro spazia da siti marketing e landing page semplici a UI per prodotti SaaS e build front-end personalizzate con React e Next.js. L&apos;obiettivo è sempre lo stesso: un risultato che si vede bene, si carica veloce e supporta i tuoi obiettivi di business.
            </p>
            <p>
              I progetti vengono di solito gestiti da remoto, con milestone chiare, anteprime Figma e link di staging. Manteniamo la comunicazione strutturata e adatta al lavoro asincrono così puoi concentrarti sul tuo lavoro mentre le cose avanzano.
            </p>
            <p>
              Se stai cercando un partner di design e sviluppo a lungo termine che conosca sia le aspettative italiane che quelle internazionali, saremo felici di sentirti.
            </p>
          </motion.div>

          <div className="mt-8">
            <Link href="/it/contact" className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
              Inizia una conversazione
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
