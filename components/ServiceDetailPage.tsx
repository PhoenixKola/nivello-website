'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import BottomCta from '@/components/BottomCta'
import { getRoutePath, type Locale } from '@/lib/site'
import { getService, getServicePath, getServices, type ServiceSlug } from '@/lib/services'

const icons = { compass: Compass, megaphone: Megaphone, palette: Palette, code: Code2 }
const order: ServiceSlug[] = ['strategy', 'marketing', 'design', 'development']

const copy = {
  en: {
    back: 'All services',
    discuss: 'Discuss the project',
    blueprint: 'Engagement blueprint',
    firstOutput: 'First tangible output',
    howEyebrow: 'How the engagement works',
    howTitle: 'A practical sequence, with a useful output at every step.',
    howBody: 'The work is structured so decisions build on each other. You see progress early, review concrete material, and always know what comes next.',
    ideal: 'Best suited for',
    leaveWith: 'You leave with',
    deliverable: 'Deliverable',
    outcome: 'Why it matters',
    outcomesEyebrow: 'What changes',
    outcomesTitle: 'The result is not another document. It is better decisions.',
    next: 'Continue with',
    viewNext: 'View next service'
  },
  it: {
    back: 'Tutti i servizi',
    discuss: 'Parliamo del progetto',
    blueprint: 'Blueprint del progetto',
    firstOutput: 'Primo output concreto',
    howEyebrow: 'Come funziona il progetto',
    howTitle: 'Una sequenza pratica, con un output utile a ogni fase.',
    howBody: 'Il lavoro e strutturato per costruire ogni decisione sulla precedente. Vedi progressi presto, revisioni materiali concreti e sai sempre quale sara il prossimo passo.',
    ideal: 'Ideale per',
    leaveWith: 'Cosa ottieni',
    deliverable: 'Deliverable',
    outcome: 'Perche conta',
    outcomesEyebrow: 'Cosa cambia',
    outcomesTitle: 'Il risultato non e un altro documento. Sono decisioni migliori.',
    next: 'Continua con',
    viewNext: 'Vedi il prossimo servizio'
  }
} satisfies Record<Locale, Record<string, string>>

export default function ServiceDetailPage({ slug, locale = 'en' }: { slug: ServiceSlug; locale?: Locale }) {
  const service = getService(slug, locale)
  const reducedMotion = useReducedMotion()
  if (!service) return null

  const t = copy[locale]
  const Icon = icons[service.icon]
  const serviceIndex = order.indexOf(slug)
  const allServices = getServices(locale)
  const nextService = allServices[(serviceIndex + 1) % allServices.length]
  const NextIcon = icons[nextService.icon]
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' as const, delay }
  })

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95" style={{ ['--service-color' as string]: service.color }}>
      <section>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }} className="max-w-3xl">
            <Link href={getRoutePath('services', locale)} className="mb-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.back}
            </Link>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                <Icon className="h-5 w-5" style={{ color: service.color }} />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">0{serviceIndex + 1} / 04</p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: service.color }}>{service.label}</p>
              </div>
            </div>
            <h1 className="font-display text-[2.75rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.8rem] dark:text-white">{service.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300/80">{service.intro}</p>
            <Link href={getRoutePath('contact', locale)} className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              {t.discuss}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.65, delay: 0.1, ease: 'easeOut' }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_80px_-34px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.08]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.blueprint}</p>
              <span className="font-display text-xl font-semibold text-slate-200 dark:text-slate-700">0{serviceIndex + 1}</span>
            </div>
            <div className="p-5 sm:p-6">
              {service.process.map((step, index) => (
                <div key={step} className="relative grid grid-cols-[auto_1fr] gap-4 pb-5 last:pb-0">
                  {index < service.process.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-slate-200 dark:bg-white/10" />}
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: service.color }}>0{index + 1}</span>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{service.deliverables[index]}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-3 bg-slate-50 px-5 py-4 dark:bg-slate-950/50">
              <Check className="mt-0.5 h-4 w-4" style={{ color: service.color }} strokeWidth={3} />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.firstOutput}</p>
                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">{service.deliverables[0]}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <motion.div {...rise()} className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                <Icon className="h-4.5 w-4.5" style={{ color: service.color }} />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{service.label}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">04 {locale === 'it' ? 'fasi coordinate' : 'coordinated stages'}</p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.howEyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{t.howTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{t.howBody}</p>
            <div className="mt-7 border-l-2 bg-slate-100/70 p-4 dark:bg-white/[0.035]" style={{ borderColor: service.color }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.ideal}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">{service.ideal}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {service.deliverables.slice(0, 2).map(item => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-400">{t.leaveWith}</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-4">
            {service.process.map((step, index) => (
              <motion.article key={step} {...rise(index * 0.07)} className="group grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--service-color)] hover:shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] sm:grid-cols-[auto_1fr] sm:p-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:bg-white/[0.045]">
                <span className="font-display text-3xl font-semibold text-slate-200 transition-colors group-hover:text-[var(--service-color)] dark:text-white/[0.08]">0{index + 1}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{step}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.deliverable}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{service.deliverables[index]}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.outcome}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{service.outcomes[index % service.outcomes.length]}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div {...rise()} className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.outcomesEyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{t.outcomesTitle}</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {service.outcomes.map((outcome, index) => (
              <motion.div key={outcome} {...rise(index * 0.07)} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:shadow-none">
                <span className="absolute right-4 top-2 font-display text-5xl font-semibold text-slate-900/[0.05] dark:text-white/[0.06]">0{index + 1}</span>
                <Check className="h-5 w-5" style={{ color: service.color }} strokeWidth={3} />
                <p className="relative mt-8 font-display text-xl font-semibold leading-snug">{outcome}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...rise(0.1)} className="mt-10">
            <Link href={getServicePath(nextService.slug, locale)} className="group grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--next-color)] hover:shadow-[0_22px_60px_-36px_rgba(15,23,42,0.4)] sm:grid-cols-[auto_1fr_auto] sm:items-center dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.045]" style={{ ['--next-color' as string]: nextService.color }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                <NextIcon className="h-5 w-5" style={{ color: nextService.color }} />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t.next}</p>
                <p className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">{nextService.title}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t.viewNext}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      <BottomCta locale={locale} />
    </main>
  )
}
