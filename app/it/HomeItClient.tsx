'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Compass,
  Globe2,
  Languages,
  Megaphone,
  Palette
} from 'lucide-react'
import TestimonialsSectionIt from '@/components/TestimonialsSectionIt'
import BottomCta from '@/components/BottomCta'
import AnimatedHeroGraphic from '@/components/AnimatedHeroGraphic'
import HomeWorkSnapshot from '@/components/HomeWorkSnapshot'
import ClientLogoMarquee from '@/components/ClientLogoMarquee'
import { getRoutePath } from '@/lib/site'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

const processSteps = [
  {
    title: 'Analisi e strategia',
    body: 'Chiarifichiamo obiettivi, pubblico, offerta e vincoli prima di iniziare il design. Cosi il progetto parte con una direzione pratica.',
    icon: Compass,
    color: 'var(--brand-gold)'
  },
  {
    title: 'Messaggio e marketing',
    body: 'Costruiamo storia, call to action e percorso di conversione intorno a cio che il cliente deve capire. Ogni pagina ha un compito chiaro.',
    icon: Megaphone,
    color: 'var(--brand-blue)'
  },
  {
    title: 'Direzione visiva',
    body: 'Creiamo un sistema visivo premium, utile e coerente con il brand. Il risultato e curato senza diventare decorazione fine a se stessa.',
    icon: Palette,
    color: 'var(--brand-purple)'
  },
  {
    title: 'Sviluppo e lancio',
    body: 'Sviluppiamo il sito con React e Next.js, testiamo i flussi importanti e prepariamo un lancio stabile. Dopo il lancio, migliorarlo resta semplice.',
    icon: Code2,
    color: 'var(--brand-pink)'
  }
]

export default function HomeItClient() {
  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="relative overflow-hidden bg-stone-50 dark:bg-slate-950/95">
        <div className="relative z-10 mx-auto grid min-h-[60vh] max-w-7xl items-center gap-10 px-6 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:py-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' as const }} className="text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">
                Attivi in Europa
              </span>
            </div>

            <h1 className="text-[2.7rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] dark:text-white">
              Sviluppo web moderno per brand{' '}
              <span className="italic text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">ambiziosi.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0 dark:text-slate-300/75">
              Sviluppiamo siti e applicazioni web veloci e facili da mantenere con React e Next.js, con strategia, design e marketing a supporto del prodotto quando servono.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link href={getRoutePath('work', 'it')} className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 dark:border-white/20 dark:bg-transparent dark:text-white dark:shadow-none dark:hover:border-[var(--brand-gold)]/55 dark:hover:bg-white/[0.06]">
                Guarda i lavori
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={getRoutePath('contact', 'it')} className="rounded-full border border-slate-300 bg-white/85 px-8 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)] dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[var(--brand-gold)]/60">
                Prenota una call
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
              {[
                { icon: Languages, label: 'Italiano e inglese' },
                { icon: CheckCircle2, label: 'Dallo sviluppo al lancio' },
                { icon: Code2, label: 'React / Next.js' },
                { icon: Globe2, label: 'Mercato europeo' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <item.icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center justify-center lg:justify-end">
            <AnimatedHeroGraphic />
          </div>
        </div>
        <ClientLogoMarquee locale="it" />
      </section>

      <motion.section className="bg-stone-50 dark:bg-slate-950/95" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">Metodo</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">Un processo semplice in quattro passi.</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">Strategia, messaggio e design supportano il lavoro centrale: sviluppare e lanciare un prodotto digitale veloce e mantenibile.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--step-color)] hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-[var(--step-color)]" style={{ ['--step-color' as string]: step.color }}>
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <HomeWorkSnapshot locale="it" />

      <TestimonialsSectionIt />
      <BottomCta locale="it" />
    </main>
  )
}
