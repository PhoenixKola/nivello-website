'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Compass,
  Globe2,
  Languages,
  Megaphone,
  Palette,
  Sparkles
} from 'lucide-react'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'About Nivello',
    titleStart: 'A lean studio for ',
    titleAccent: 'serious digital builds.',
    intro:
      'We design and develop modern websites and web apps with senior attention from the first technical decision to the final release.',
    workCta: 'See what we build',
    contactCta: 'Start a project',
    badges: ['Development-led', 'Italian & English', 'Working across Europe'],
    graphic: {
      eyebrow: 'Nivello build system',
      status: 'System online',
      core: 'Core discipline',
      title: 'Development',
      description: 'Fast, maintainable, ready to evolve.',
      support: ['Strategy', 'Design', 'Messaging'],
      release: 'Release ready'
    },
    principlesEyebrow: 'How we think',
    principlesTitle: 'Small team. Clear decisions. Serious implementation.',
    principlesIntro:
      'The build stays at the centre. Every supporting discipline exists to make the final product clearer, stronger, and easier to maintain.',
    principles: [
      {
        title: 'Development at the core',
        body: 'We build in React and Next.js with performance, accessibility, and long-term ownership treated as product requirements—not cleanup tasks.',
        label: 'Core discipline',
        icon: Code2,
        color: 'var(--brand-blue)',
        core: true
      },
      {
        title: 'Direction before noise',
        body: 'A focused scope keeps the product useful and the technical decisions grounded.',
        label: 'Strategy support',
        icon: Compass,
        color: 'var(--brand-gold)'
      },
      {
        title: 'Interfaces with purpose',
        body: 'Design creates hierarchy, consistency, and a smoother path through the product.',
        label: 'Design support',
        icon: Palette,
        color: 'var(--brand-purple)'
      },
      {
        title: 'Every screen has a job',
        body: 'Messaging and conversion thinking are brought in where they help people understand, trust, and act—without turning the project into a marketing exercise.',
        label: 'Messaging support',
        icon: Megaphone,
        color: 'var(--brand-pink)'
      }
    ],
    processEyebrow: 'A clear route to launch',
    processTitle: 'From a useful idea to a product ready to ship.',
    processBody:
      'A calm process, visible checkpoints, and no mystery handovers. You always know what is being decided, built, and tested.',
    processCta: 'See how we work',
    stages: ['Direction', 'Scope', 'Design', 'Build', 'Launch']
  },
  it: {
    eyebrow: 'Chi e Nivello',
    titleStart: 'Uno studio snello per ',
    titleAccent: 'progetti digitali seri.',
    intro:
      'Progettiamo e sviluppiamo siti e app web moderni con attenzione senior, dalla prima decisione tecnica fino al rilascio.',
    workCta: 'Guarda cosa costruiamo',
    contactCta: 'Inizia un progetto',
    badges: ['Guidati dallo sviluppo', 'Italiano e inglese', 'Attivi in Europa'],
    graphic: {
      eyebrow: 'Sistema di build Nivello',
      status: 'Sistema online',
      core: 'Disciplina centrale',
      title: 'Sviluppo',
      description: 'Veloce, mantenibile, pronto a evolvere.',
      support: ['Strategia', 'Design', 'Messaggio'],
      release: 'Pronto al rilascio'
    },
    principlesEyebrow: 'Come ragioniamo',
    principlesTitle: 'Team snello. Scelte chiare. Implementazione seria.',
    principlesIntro:
      'Il build resta al centro. Ogni disciplina di supporto serve a rendere il prodotto finale piu chiaro, solido e semplice da mantenere.',
    principles: [
      {
        title: 'Sviluppo al centro',
        body: 'Costruiamo in React e Next.js considerando performance, accessibilita e gestione futura come requisiti del prodotto, non come interventi da rimandare.',
        label: 'Disciplina centrale',
        icon: Code2,
        color: 'var(--brand-blue)',
        core: true
      },
      {
        title: 'Direzione prima del rumore',
        body: 'Uno scope focalizzato mantiene il prodotto utile e le decisioni tecniche concrete.',
        label: 'Supporto strategia',
        icon: Compass,
        color: 'var(--brand-gold)'
      },
      {
        title: 'Interfacce con uno scopo',
        body: 'Il design crea gerarchia, coerenza e un percorso piu fluido dentro il prodotto.',
        label: 'Supporto design',
        icon: Palette,
        color: 'var(--brand-purple)'
      },
      {
        title: 'Ogni schermata ha un compito',
        body: 'Messaggio e conversione entrano dove aiutano le persone a capire, fidarsi e agire, senza trasformare il progetto in un esercizio di marketing.',
        label: 'Supporto messaggio',
        icon: Megaphone,
        color: 'var(--brand-pink)'
      }
    ],
    processEyebrow: 'Un percorso chiaro verso il lancio',
    processTitle: 'Da un’idea utile a un prodotto pronto per il rilascio.',
    processBody:
      'Un processo calmo, checkpoint visibili e nessun passaggio misterioso. Sai sempre cosa stiamo decidendo, costruendo e testando.',
    processCta: 'Scopri come lavoriamo',
    stages: ['Direzione', 'Scope', 'Design', 'Sviluppo', 'Lancio']
  }
}

function StudioSystemGraphic({ locale, reducedMotion }: { locale: Locale; reducedMotion: boolean | null }) {
  const content = copy[locale].graphic
  const codeLines = ['w-[72%]', 'w-[52%]', 'w-[84%]', 'w-[63%]']

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.12 }}
      className="relative mx-auto aspect-square w-full max-w-[520px]"
    >
      <motion.div
        className="absolute inset-[8%] rounded-full border border-[var(--brand-blue)]/20 dark:border-[var(--brand-blue)]/25"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={reducedMotion ? undefined : { duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute left-[12%] top-[5%] h-2.5 w-2.5 rounded-full bg-[var(--brand-gold)]" />
        <span className="absolute bottom-[10%] right-[8%] h-2.5 w-2.5 rounded-full bg-[var(--brand-purple)]" />
      </motion.div>

      <motion.div
        animate={reducedMotion ? undefined : { y: [-5, 7, -5], rotate: [-1, 1, -1] }}
        transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-x-[8%] top-[11%] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:shadow-none sm:p-5"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[var(--brand-blue)] dark:border-white/10 dark:bg-white/[0.05] dark:text-[var(--brand-gold)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{content.eyebrow}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{content.status}</span>
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] font-semibold text-slate-400">04 / 04</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white">
            <p className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-sky-300">{content.core}</p>
            <p className="relative mt-2 font-display text-2xl font-semibold">{content.title}</p>
            <p className="relative mt-2 max-w-[16rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">{content.description}</p>

            <div className="relative mt-6 space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              {codeLines.map((width, index) => (
                <motion.span
                  key={width}
                  className={`block h-1.5 rounded-full bg-[var(--brand-blue)] ${width}`}
                  animate={reducedMotion ? undefined : { opacity: [0.35, 1, 0.35], scaleX: [0.92, 1, 0.92] }}
                  transition={reducedMotion ? undefined : { duration: 2.8, repeat: Infinity, delay: index * 0.25, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {content.support.map((item, index) => (
              <motion.div
                key={item}
                animate={reducedMotion ? undefined : { x: [0, index % 2 === 0 ? 4 : -3, 0] }}
                transition={reducedMotion ? undefined : { duration: 4.5 + index, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ['var(--brand-gold)', 'var(--brand-purple)', 'var(--brand-pink)'][index] }}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item}</span>
                </div>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              </motion.div>
            ))}

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 dark:border-emerald-400/15 dark:bg-emerald-400/[0.07]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{content.release}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AboutPage({ locale = 'en' }: { locale?: Locale }) {
  const content = copy[locale]
  const reducedMotion = useReducedMotion()

  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' as const, delay }
  })

  const badgeIcons = [Code2, Languages, Globe2]

  return (
    <main className="overflow-hidden bg-stone-50 dark:bg-slate-950/95">
      <section className="relative">
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:px-10 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.72, ease: 'easeOut' }}
            className="relative z-10 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{content.eyebrow}</span>
            </div>

            <h1 className="mt-6 font-display text-[3rem] font-bold leading-[0.98] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.4rem] dark:text-white">
              {content.titleStart}
              <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{content.titleAccent}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300/85">{content.intro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={getRoutePath('work', locale)}
                className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                {content.workCta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={getRoutePath('contact', locale)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/75 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[var(--brand-blue)] dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[var(--brand-gold)]/60"
              >
                {content.contactCta}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
              {content.badges.map((badge, index) => {
                const Icon = badgeIcons[index]
                return (
                  <span key={badge} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Icon className="h-3.5 w-3.5 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                    {badge}
                  </span>
                )
              })}
            </div>
          </motion.div>

          <StudioSystemGraphic locale={locale} reducedMotion={reducedMotion} />
        </div>
      </section>

      <section id="principles" className="relative scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div {...rise()} className="mb-12 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{content.principlesEyebrow}</p>
              <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">{content.principlesTitle}</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-300/80">{content.principlesIntro}</p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-12">
            {content.principles.map((principle, index) => {
              const Icon = principle.icon
              const core = Boolean(principle.core)
              const layout = index === 0 ? 'md:col-span-7 md:row-span-2' : index === 1 || index === 2 ? 'md:col-span-5' : 'md:col-span-12'

              return (
                <motion.article
                  key={principle.title}
                  {...rise(index * 0.06)}
                  className={`group relative overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${layout} ${
                    core
                      ? 'min-h-[420px] border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:shadow-none'
                      : 'border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:shadow-none'
                  }`}
                >
                  <div className={core ? 'relative flex h-full flex-col' : `relative ${index === 3 ? 'md:grid md:grid-cols-[auto_0.72fr_1fr] md:items-center md:gap-6' : ''}`}>
                    <div className="flex items-start justify-between gap-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                        <Icon className="h-5 w-5" style={{ color: principle.color }} />
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-300 dark:text-slate-600">0{index + 1}</span>
                    </div>

                    <div className={core ? 'mt-auto pt-20' : index === 3 ? 'mt-5 md:mt-0' : 'mt-8'}>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${core ? 'text-[var(--brand-blue)] dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'}`}>{principle.label}</p>
                      <h3 className={`${core ? 'mt-3 max-w-md text-3xl sm:text-4xl' : 'mt-2 text-xl'} font-display font-semibold tracking-tight`}>{principle.title}</h3>
                    </div>

                    <p className={`${core ? 'mt-4 max-w-xl text-slate-500 dark:text-slate-400' : index === 3 ? 'mt-4 text-slate-500 dark:text-slate-300/80 md:mt-0' : 'mt-3 text-slate-500 dark:text-slate-300/80'} text-sm leading-relaxed`}>{principle.body}</p>

                    {core && (
                      <div className="mt-7 grid grid-cols-3 gap-2">
                        {['React', 'Next.js', 'TypeScript'].map((technology, technologyIndex) => (
                          <motion.span
                            key={technology}
                            animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                            transition={reducedMotion ? undefined : { duration: 3, repeat: Infinity, delay: technologyIndex * 0.4 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                          >
                            {technology}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-20 px-5 pb-20 sm:px-6 lg:pb-28">
        <motion.div
          {...rise()}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:shadow-none sm:px-8 sm:py-10 lg:px-10"
        >
          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{content.processEyebrow}</p>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{content.processTitle}</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{content.processBody}</p>
              <Link
                href={getRoutePath('process', locale)}
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                {content.processCta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <ol className="grid gap-2 sm:grid-cols-5">
              {content.stages.map((stage, index) => (
                <li key={stage} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.055]">
                  <motion.span
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.55, delay: 0.12 + index * 0.12, ease: 'easeOut' }}
                  />
                  <span className="font-mono text-[9px] font-semibold text-slate-400 dark:text-slate-500">0{index + 1}</span>
                  <span className="mt-5 block text-xs font-semibold text-slate-700 dark:text-slate-200">{stage}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
