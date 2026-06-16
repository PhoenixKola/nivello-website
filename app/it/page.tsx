'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
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
      <section className="relative overflow-hidden">

        {/* ── Base background ── */}
        <div className="absolute inset-0 bg-[#fafaf9] dark:bg-ink" />
        <div className="absolute inset-0 bg-linear-to-b from-white via-stone-50/40 to-white dark:hidden" />

        {/* ── Single directional wash — one light source behind the visual ── */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[44rem] w-[44rem] rounded-full bg-emerald-300/20 blur-[150px] dark:bg-emerald-500/14" />

        {/* ── Architectural grid (dark only) ── */}
        <div
          className="absolute inset-0 hidden dark:block"
          // style={{
          //   backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          //   backgroundSize: '72px 72px'
          // }}
        />

        {/* ── Film grain — adds depth & premium texture ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay dark:opacity-[0.08]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
          }}
        />

        {/* ── Edge fades ── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white to-transparent dark:from-ink" />

        {/* ── Content — two columns: text left, visual right ── */}
        <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:py-20">

          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">
                Basati in Italia · Attivi in Europa
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.7rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] dark:text-white">
              Siti web premium per brand italiani{' '}
              <span className="italic">
                <span className="bg-clip-text text-transparent dark:hidden" style={{ backgroundImage: 'linear-gradient(120deg, #047857 0%, #0369a1 45%, #a21caf 100%)' }}>ambiziosi.</span>
                <span className="hidden bg-clip-text text-transparent dark:inline" style={{ backgroundImage: 'linear-gradient(120deg, #6ee7b7 0%, #38bdf8 48%, #f0abfc 100%)' }}>ambiziosi.</span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0 dark:text-slate-300/75">
              Strategia, design e sviluppo Next.js per brand che vogliono comunicare meglio, apparire più credibili e convertire di più.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link href="/it/work" className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:shadow-emerald-500/10 dark:hover:bg-slate-100">
                Guarda i nostri lavori
              </Link>
              <Link href="/it/contact" className="rounded-full border border-slate-300 bg-white/80 px-8 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/10">
                Prenota una chiamata →
              </Link>
            </div>

            {/* Service chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
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

          {/* Right: hero graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <motion.div
              className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px]"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' as const }}
            >
              {/* Light-mode: soft feathered spotlight — contrast without a panel or border */}
              <div className="pointer-events-none absolute -inset-10 -z-10 dark:hidden">
                <div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(58% 52% at 50% 46%, rgba(15,23,42,0.34) 0%, rgba(15,23,42,0.12) 50%, rgba(15,23,42,0) 76%)' }}
                />
                <div className="absolute right-3 top-6 h-44 w-44 rounded-full bg-emerald-400/30 blur-3xl" />
                <div className="absolute bottom-6 left-3 h-44 w-44 rounded-full bg-sky-400/25 blur-3xl" />
              </div>

              {/* Dark-mode glow — artwork floats free on the near-black canvas */}
              <div className="pointer-events-none absolute -inset-12 -z-10 hidden rounded-full bg-emerald-500/20 blur-3xl dark:block" />

              <Image
                src="/hero-nivello-dark.png"
                alt="Abstract digital studio artwork for Nivello"
                width={1122}
                height={1402}
                priority
                className="relative h-auto w-full object-contain drop-shadow-[0_30px_70px_rgba(16,185,129,0.22)]"
              />
            </motion.div>
          </motion.div>
        </div>

      </section>

      {/* ─── Perché i brand italiani lavorano con noi ─────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-ink-soft"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
                Perché i brand italiani lavorano con noi
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
                Uniamo standard internazionali a una comprensione reale delle aspettative locali — dal linguaggio alle scelte visive.
              </p>
            </div>
            <Link href="/it/services" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
              Scopri i nostri servizi →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: 'Prima la strategia', body: 'Ogni progetto inizia con posizionamento, obiettivi e un piano concreto.' },
              { title: 'Comunicazione chiara', body: 'In italiano o inglese, asincrona e strutturata, con aggiornamenti regolari.' },
              { title: 'Stack tecnologico moderno', body: 'React, Next.js e best practice per un sito veloce e facile da mantenere.' }
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
              >
                <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{c.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Un processo in tre passi ─────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">Un processo semplice in tre passi</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">Nessuna call infinita, nessun passaggio caotico. Solo un percorso chiaro dall&apos;idea al lancio.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { n: '1', title: 'Scoperta e analisi', body: 'Capiamo i tuoi obiettivi, il prodotto e il mercato, poi ti proponiamo uno scope concreto.' },
              { n: '2', title: 'Design e contenuti', body: 'Creiamo il linguaggio visivo, i layout e i testi pensati per il tuo pubblico.' },
              { n: '3', title: 'Sviluppo e lancio', body: 'Costruiamo, testiamo e pubblichiamo il sito, poi iteriamo in base all\'utilizzo reale.' }
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
              >
                <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 font-display text-sm font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {s.n}
                </span>
                <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Lavori in evidenza ───────────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-ink-soft"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Lavori selezionati</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">Una panoramica di ciò che costruiamo.</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">Progetti reali e online nel settore hospitality, attività locali e servizi professionali.</p>
            </div>
            <Link href="/it/work" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">Vedi tutti i progetti →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { href: 'https://rombonord.com/it/', shot: '/work-rombonord.webp', cat: 'Ospitalità · Ristorante & Bar', title: 'Rombo Nord', body: 'Sito bilingue per un ristorante e cocktail bar sul mare a Genova Pegli.' },
              { href: 'https://yourassistinitaly.it/', shot: '/work-yourassist.webp', cat: 'Servizi expat · Consulenza', title: 'Your Assist in Italy', body: 'Sito bilingue per una consulenza immigrazione con sede a Firenze.' },
              { href: 'https://consteam.eu/', shot: '/work-consteam.webp', cat: 'Attività locale · Servizi', title: 'Consteam', body: 'Sito multi-pagina per un\'azienda di pulizie e manutenzioni professionali.' },
              { href: 'https://le-camelie.com/', shot: '/work-lecamelie.webp', cat: 'Ospitalità · Guesthouse', title: 'Le Camelie', body: 'Sito orientato alle prenotazioni per una guesthouse nel centro di Genova.' }
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 dark:border-white/10">
                    <Image
                      src={p.shot}
                      alt={`Sito ${p.title}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.cat}</p>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{p.body}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Con chi lavoriamo meglio ──────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Fit</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">Con chi lavoriamo meglio.</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Siamo un buon match se tieni ai dettagli, vuoi un feedback onesto e preferisci un partner che si senta parte del tuo team.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">Ti riconosci se</p>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">
                <li>Vuoi un look moderno e pulito che resti umano.</li>
                <li>Sei aperto a feedback diretto su messaggi e UX.</li>
                <li>Preferisci aggiornamenti strutturati alle riunioni infinite.</li>
                <li>Stai vendendo qualcosa di reale e vuoi un sito alla sua altezza.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">Cosa puoi aspettarti</p>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">
                <li>Timeline chiara e milestone definite prima di iniziare.</li>
                <li>Design revisionabile in Figma prima dello sviluppo.</li>
                <li>Implementazione veloce con React e Next.js.</li>
                <li>Dettagli pensati per il mercato italiano ed europeo.</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/it/contact" className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
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
