'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import TestimonialsSectionIt from '@/components/TestimonialsSectionIt'
import FaqSectionIt from '@/components/FaqSectionIt'
import BottomCtaIt from '@/components/BottomCtaIt'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}


export default function HomeIt() {
  return (
    <main className="bg-white dark:bg-[#020408]">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">

        {/* ── Light mode background ── */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute inset-0 bg-[#fafaf9]" />
          <div className="absolute inset-0 bg-linear-to-br from-stone-50 via-white to-sky-50/30" />
          <div className="absolute bottom-0 right-1/3 h-[700px] w-[700px] translate-y-1/3 rounded-full bg-emerald-400/7 blur-[160px]" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/4 -translate-y-1/4 rounded-full bg-sky-300/6 blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* ── Dark mode: directional studio atmosphere ── */}
        <div className="absolute inset-0 hidden dark:block">
          <div className="absolute inset-0 bg-[#020408]" />
          <div className="absolute right-0 top-1/2 h-[1100px] w-[1100px] translate-x-[35%] -translate-y-1/2 rounded-full bg-emerald-500/13 blur-[200px]" />
          <div className="absolute right-0 top-0 h-[650px] w-[650px] translate-x-[20%] -translate-y-[25%] rounded-full bg-sky-400/11 blur-[160px]" />
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-[35%] -translate-y-1/2 rounded-full bg-fuchsia-500/5.5 blur-[130px]" />
          <div className="absolute left-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-amber-400/4.5 blur-[100px]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
              backgroundSize: '72px 72px'
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 90% 75% at 62% 50%, transparent 10%, rgba(2,4,8,0.82) 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#020408] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-[#020408] to-transparent" />
        </div>

        {/* ── Ghost "STUDIO" — design accent ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex select-none items-center overflow-hidden"
        >
          <span
            className="font-black uppercase leading-none tracking-tighter text-slate-900/4 dark:text-white/[0.022]"
            style={{ fontSize: 'clamp(5rem, 16vw, 16rem)' }}
          >
            STUDIO
          </span>
        </div>

        {/* ── Bottom glowing line (dark) ── */}
        <div className="absolute bottom-0 left-0 right-0 hidden h-px dark:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(16,185,129,0.2) 50%, rgba(255,255,255,0.06) 70%, transparent)' }} />

        {/* ── Main content — two columns ── */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[6fr_7fr] lg:gap-10">

            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/4 dark:backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">
                  Basati in Italia · Attivi in Europa
                </span>
              </motion.div>

              <h1 className="mb-6 text-[2.6rem] font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] dark:text-white">
                Siti web premium
                <br />
                per brand italiani{' '}
                <span className="italic">
                  <span className="bg-clip-text text-transparent dark:hidden" style={{ backgroundImage: 'linear-gradient(135deg, #047857 0%, #0369a1 45%, #a21caf 100%)' }}>ambiziosi.</span>
                  <span className="hidden bg-clip-text text-transparent dark:inline" style={{ backgroundImage: 'linear-gradient(135deg, #6ee7b7 0%, #38bdf8 48%, #f0abfc 100%)' }}>ambiziosi.</span>
                </span>
              </h1>

              <p className="mb-10 max-w-[460px] text-base leading-relaxed text-slate-500 sm:text-[1.05rem] dark:text-slate-300/70">
                Strategia, design e sviluppo Next.js per brand che vogliono comunicare meglio, apparire più credibili e convertire di più.
              </p>

              <div className="mb-10 flex flex-wrap gap-4">
                <Link href="/it/work" className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                  Guarda i nostri lavori
                </Link>
                <Link href="/it/contact" className="rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/9">
                  Prenota una chiamata →
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: '🇮🇹', label: 'Italiano e inglese' },
                  { icon: '🎯', label: 'Dalla strategia al lancio' },
                  { icon: '⚡', label: 'React / Next.js' },
                  { icon: '🌍', label: 'Mercato europeo' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: browser mockup + floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden pl-6 pr-4 pt-10 pb-10 lg:block"
            >
              {/* Floating badge — Brand Strategy */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="absolute left-0 top-[28%] z-20"
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.8, delay: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">● Brand Strategy</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Posizionamento e messaggi</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating badge — UX/UI Design */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.05 }}
                className="absolute right-0 top-0 z-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.2, delay: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">● UX/UI Design</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Da Figma alla produzione</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating badge — Next.JS */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.25 }}
                className="absolute bottom-0 left-6 z-20"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, delay: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">● Sviluppo Next.JS</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">App Router · TypeScript</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Browser frame */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-[#0d1117] dark:shadow-black/50">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-[#161b22]">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <div className="mx-3 flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">nivello.it</span>
                  </div>
                </div>
                <div className="flex gap-4 p-5">
                  <div className="w-32 shrink-0 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                    {[85, 65, 90, 55, 75, 45, 80, 60].map((w, i) => (
                      <div key={i} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700/80" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-4/5 rounded-full bg-emerald-200/80 dark:bg-emerald-500/25" />
                      <div className="flex gap-2.5 pt-1">
                        <div className="h-8 flex-1 rounded-xl bg-slate-200/80 dark:bg-slate-700/60" />
                        <div className="h-8 flex-1 rounded-xl bg-sky-200/70 dark:bg-sky-800/35" />
                        <div className="h-8 flex-1 rounded-xl bg-fuchsia-200/60 dark:bg-fuchsia-800/25" />
                      </div>
                      <div className="h-2.5 w-3/4 rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                      <div className="h-2.5 w-1/2 rounded-full bg-slate-200/50 dark:bg-slate-700/40" />
                    </div>
                    <div className="flex gap-2.5">
                      {[
                        'bg-emerald-200/70 dark:bg-emerald-500/20',
                        'bg-sky-200/60 dark:bg-sky-800/30',
                        'bg-fuchsia-200/50 dark:bg-fuchsia-800/20'
                      ].map((cls, i) => (
                        <div key={i} className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                          <div className={`h-2 w-full rounded-full ${cls}`} />
                          <div className="mt-1.5 h-2 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="mt-1.5 h-2 w-3/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* ─── Perché i brand italiani lavorano con noi ─────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
                Perché i brand italiani lavorano con noi
              </h2>
              <p className="mt-2 text-sm text-slate-500 md:max-w-xl dark:text-slate-300">
                Uniamo standard internazionali a una comprensione reale delle aspettative locali — dal linguaggio alle scelte visive.
              </p>
            </div>
            <Link href="/it/services" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
              Scopri i nostri servizi →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Prima la strategia', body: 'Ogni progetto inizia con posizionamento, obiettivi e un piano concreto.' },
              { title: 'Comunicazione chiara', body: 'In italiano o inglese, asincrona e strutturata, con aggiornamenti regolari.' },
              { title: 'Stack tecnologico moderno', body: 'React, Next.js e best practice per un sito veloce e facile da mantenere.' }
            ].map(c => (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Un processo in tre passi ─────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">Un processo semplice in tre passi</h2>
            <p className="mt-2 text-sm text-slate-500 md:max-w-xl dark:text-slate-300">Nessuna call infinita, nessun passaggio caotico. Solo un percorso chiaro dall&apos;idea al lancio.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: '1', title: 'Scoperta e analisi', body: 'Capiamo i tuoi obiettivi, il prodotto e il mercato, poi ti proponiamo uno scope concreto.' },
              { n: '2', title: 'Design e contenuti', body: 'Creiamo il linguaggio visivo, i layout e i testi pensati per il tuo pubblico.' },
              { n: '3', title: 'Sviluppo e lancio', body: 'Costruiamo, testiamo e pubblichiamo il sito, poi iteriamo in base all\'utilizzo reale.' }
            ].map(s => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
                <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {s.n}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Lavori in evidenza ───────────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Lavori selezionati</p>
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">Una panoramica di ciò che costruiamo.</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">Progetti reali nel settore hospitality, SaaS ed e-commerce.</p>
            </div>
            <Link href="/it/work" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">Vedi tutti i progetti →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { cat: 'Ospitalità · Sito', title: 'Hotel boutique in Toscana', body: 'Nuova direzione di brand e sito orientato alle prenotazioni dirette per ospiti internazionali.', stat: '+42% prenotazioni dirette in sei mesi.' },
              { cat: 'SaaS · Sito prodotto', title: 'Piattaforma workflow per PMI', body: 'Posizionamento chiaro e UX pensata per imprenditori italiani non tecnici.', stat: 'Più richieste demo da traffico organico.' },
              { cat: 'E-commerce · Brand refresh', title: 'Label fashion direct-to-consumer', body: 'Linguaggio visivo premium allineato all\'estetica streetwear europea.', stat: 'Tasso di aggiunta al carrello più alto sui nuovi drop.' },
              { cat: 'Servizi expat · Consulenza', title: 'Your Assist in Italy', body: 'Sito bilingue per una consulenza immigrazione che aiuta gli expat a orientarsi nella burocrazia italiana.', stat: 'Posizionamento più chiaro, più richieste dirette.' }
            ].map(p => (
              <article key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.cat}</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{p.body}</p>
                <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">{p.stat}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Con chi lavoriamo meglio ──────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Fit</p>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">Con chi lavoriamo meglio.</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
              Siamo un buon match se tieni ai dettagli, vuoi un feedback onesto e preferisci un partner che si senta parte del tuo team.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ti riconosci se</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                <li>Vuoi un look moderno e pulito che resti umano.</li>
                <li>Sei aperto a feedback diretto su messaggi e UX.</li>
                <li>Preferisci aggiornamenti strutturati alle riunioni infinite.</li>
                <li>Stai vendendo qualcosa di reale e vuoi un sito alla sua altezza.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Cosa puoi aspettarti</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                <li>Timeline chiara e milestone definite prima di iniziare.</li>
                <li>Design revisionabile in Figma prima dello sviluppo.</li>
                <li>Implementazione veloce con React e Next.js.</li>
                <li>Dettagli pensati per il mercato italiano ed europeo.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/it/contact" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
                  Inizia una conversazione
                </Link>
                <Link href="/it/services" className="flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
                  Scopri come lavoriamo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <TestimonialsSectionIt />
      <FaqSectionIt />
      <BottomCtaIt />
    </main>
  )
}
