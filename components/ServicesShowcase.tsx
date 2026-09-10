'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import PricingSection from '@/components/PricingSection'
import { getServicePath, getServices } from '@/lib/services'
import type { Locale } from '@/lib/site'

const icons = { compass: Compass, megaphone: Megaphone, palette: Palette, code: Code2 }
const flowStages = {
  en: ['Direction', 'Demand', 'Interface', 'Launch'],
  it: ['Direzione', 'Domanda', 'Interfaccia', 'Lancio']
} satisfies Record<Locale, string[]>

const copy = {
  en: {
    eyebrow: 'Services',
    title: 'Development at the core, every supporting discipline connected.',
    intro: 'We lead with modern web development, bringing in strategy, messaging, and design to make the final product clearer, stronger, and easier to use.',
    flowLabel: 'How the work connects',
    sectionEyebrow: 'One core service, three supporting disciplines',
    sectionTitle: 'Development leads. Everything else makes the build work harder.',
    sectionBody: 'Start with the build, then add the strategy, messaging, or design support the product actually needs.',
    view: 'Explore service',
    ideal: 'Best fit'
  },
  it: {
    eyebrow: 'Servizi',
    title: 'Lo sviluppo al centro, ogni disciplina di supporto connessa.',
    intro: 'Partiamo dallo sviluppo web moderno e integriamo strategia, messaggio e design per rendere il prodotto finale piu chiaro, solido e facile da usare.',
    flowLabel: 'Come si collega il lavoro',
    sectionEyebrow: 'Un servizio centrale, tre discipline di supporto',
    sectionTitle: 'Lo sviluppo guida. Il resto rende il prodotto piu efficace.',
    sectionBody: 'Parti dal build, poi aggiungi il supporto strategico, di messaggio o design che serve davvero al prodotto.',
    view: 'Scopri il servizio',
    ideal: 'Ideale per'
  }
} satisfies Record<Locale, Record<string, string>>

export default function ServicesShowcase({ locale }: { locale: Locale }) {
  const services = getServices(locale)
  const t = copy[locale]
  const reducedMotion = useReducedMotion()
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' as const }

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.eyebrow}</p>
            <h1 className="font-display text-[2.75rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.75rem] dark:text-white">{t.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300/80">{t.intro}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_28px_70px_-32px_rgba(0,0,0,0.75)] sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{t.flowLabel}</p>
              <span className="font-display text-2xl font-semibold text-slate-200 dark:text-slate-700">01—04</span>
            </div>
            <div className="mt-6">
              {services.map((service, index) => {
                const Icon = icons[service.icon]
                return (
                  <div key={service.slug} className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3.5">
                    {index < services.length - 1 && <span className="absolute bottom-[-14px] left-[19px] top-[42px] w-px bg-slate-200 dark:bg-white/10" />}
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                      <Icon className="h-4.5 w-4.5" style={{ color: service.color }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">0{index + 1}</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{service.shortTitle}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition-colors group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300">
                      {flowStages[locale][index]}
                      <ArrowRight className="h-3.5 w-3.5" style={{ color: service.color }} />
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={transition} className="mb-12 grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.sectionEyebrow}</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{t.sectionTitle}</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 md:pb-1 dark:text-slate-300/80">{t.sectionBody}</p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = icons[service.icon]
              return (
                <motion.article key={service.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-70px' }} transition={{ ...transition, delay: index * 0.07 }} className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_-34px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:bg-white/[0.045] sm:p-7">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: service.color }} />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                      <Icon className="h-5 w-5" style={{ color: service.color }} />
                    </span>
                    <span className="font-display text-4xl font-semibold text-slate-100 transition-colors group-hover:text-slate-200 dark:text-white/[0.05] dark:group-hover:text-white/[0.08]">0{index + 1}</span>
                  </div>
                  <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{service.label}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{service.desc}</p>
                  <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {service.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: service.color }} strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.ideal}</p>
                      <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">{service.ideal}</p>
                    </div>
                    <Link href={getServicePath(service.slug, locale)} aria-label={`${t.view}: ${service.title}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white dark:border-white/10 dark:text-slate-300 dark:group-hover:border-white dark:group-hover:bg-white dark:group-hover:text-slate-950">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <PricingSection locale={locale} />
    </main>
  )
}
