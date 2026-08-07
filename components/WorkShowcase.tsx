'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Globe2, LayoutDashboard, Sparkles } from 'lucide-react'
import ProjectTypeBadges from '@/components/ProjectTypeBadges'
import WorkHeroGraphic from '@/components/WorkHeroGraphic'
import { getProjectId, getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Our work',
    titleStart: 'Two kinds of work.',
    titleAccent: 'One standard.',
    intro: 'Conversion-focused websites for the public side of a business, and custom apps for the work happening behind it.',
    explore: 'Explore the work',
    websiteNav: 'Websites & landing pages',
    websiteNavNote: 'Brand, message, conversion',
    appNav: 'Apps & digital tools',
    appNavNote: 'Workflow, clarity, operations',
    websitesEyebrow: 'Public-facing experiences',
    websitesTitle: 'Websites & landing pages',
    websitesIntro: 'Clear stories, credible design, and focused paths from first impression to action.',
    appsEyebrow: 'Behind-the-scenes products',
    appsTitle: 'Apps & digital tools',
    appsIntro: 'Purpose-built software that makes the day-to-day work easier to see, manage, and move forward.',
    projects: 'projects',
    project: 'project',
    caseStudy: 'View case study',
    appCaseStudy: 'View the combined case study',
    privateProduct: 'Private product',
    appPreview: 'Interface preview'
  },
  it: {
    eyebrow: 'I nostri lavori',
    titleStart: 'Due tipi di progetto.',
    titleAccent: 'Un unico standard.',
    intro: 'Siti orientati alla conversione per il lato pubblico del business e app custom per il lavoro che avviene dietro le quinte.',
    explore: 'Esplora i lavori',
    websiteNav: 'Siti & landing page',
    websiteNavNote: 'Brand, messaggio, conversione',
    appNav: 'App & strumenti digitali',
    appNavNote: 'Flussi, chiarezza, operativita',
    websitesEyebrow: 'Esperienze pubbliche',
    websitesTitle: 'Siti & landing page',
    websitesIntro: 'Storie chiare, design credibile e percorsi focalizzati dalla prima impressione all’azione.',
    appsEyebrow: 'Prodotti dietro le quinte',
    appsTitle: 'App & strumenti digitali',
    appsIntro: 'Software su misura che rende il lavoro quotidiano piu visibile, gestibile e semplice da portare avanti.',
    projects: 'progetti',
    project: 'progetto',
    caseStudy: 'Vedi case study',
    appCaseStudy: 'Vedi il case study completo',
    privateProduct: 'Prodotto privato',
    appPreview: 'Anteprima interfaccia'
  }
} satisfies Record<Locale, Record<string, string>>

function Count({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
      <span className="text-slate-900 dark:text-white">{String(value).padStart(2, '0')}</span>
      {label}
    </span>
  )
}

export default function WorkShowcase({ locale }: { locale: Locale }) {
  const projects = getProjects(locale)
  const websites = projects.filter(project => project.kinds.includes('website'))
  const apps = projects.filter(project => project.kinds.includes('app') && project.app)
  const t = copy[locale]
  const reducedMotion = useReducedMotion()

  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' as const, delay }
  })

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 md:pb-20 md:pt-28 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3.5 py-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.045]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{t.eyebrow}</span>
            </div>
            <h1 className="font-display text-[2.8rem] font-bold leading-[1.01] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.35rem] dark:text-white">
              {t.titleStart}{' '}
              <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300/80">{t.intro}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.12, ease: 'easeOut' }}>
            <WorkHeroGraphic locale={locale} />
          </motion.div>
          </div>

          <motion.nav aria-label={t.explore} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.18 }} className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-[62%]">
            {[
              { href: '#websites', Icon: Globe2, title: t.websiteNav, note: t.websiteNavNote, count: websites.length, color: 'var(--brand-blue)' },
              { href: '#apps', Icon: LayoutDashboard, title: t.appNav, note: t.appNavNote, count: apps.length, color: 'var(--brand-gold)' }
            ].map(item => (
              <a key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[var(--nav-color)] hover:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.065]" style={{ ['--nav-color' as string]: item.color }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  <item.Icon className="h-5 w-5" style={{ color: item.color }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{item.note}</span>
                </span>
                <span className="font-display text-2xl font-semibold text-slate-300 dark:text-slate-600">{String(item.count).padStart(2, '0')}</span>
                <ArrowDown className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-y-0.5" />
              </a>
            ))}
          </motion.nav>
        </div>
      </section>

      <section id="websites" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div {...rise()} className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.websitesEyebrow}</p>
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">{t.websitesTitle}</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.websitesIntro}</p>
            </div>
            <Count value={websites.length} label={websites.length === 1 ? t.project : t.projects} />
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {websites.map((project, index) => (
              <motion.article key={project.title} id={getProjectId(project.title)} {...rise(index * 0.05)} className="h-full scroll-mt-24">
                <Link href={getProjectPath(project.slug, locale)} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--project-color)] hover:shadow-[0_22px_60px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:bg-white/[0.045]" style={{ ['--project-color' as string]: project.color }}>
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                    <Image src={project.shot} alt={`${project.title} website`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.035]" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 h-1 w-10 rounded-full transition-all duration-300 group-hover:w-16" style={{ backgroundColor: project.color }} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{project.category}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-slate-900 dark:text-slate-50">{project.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{project.websiteSummary || project.desc}</p>
                    <ProjectTypeBadges kinds={['website']} locale={locale} className="mt-4" />
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t.caseStudy}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="apps" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div {...rise()} className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.appsEyebrow}</p>
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">{t.appsTitle}</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.appsIntro}</p>
            </div>
            <Count value={apps.length} label={apps.length === 1 ? t.project : t.projects} />
          </motion.div>

          {apps.map((project, index) => {
            if (!project.app) return null
            return (
              <motion.article key={project.slug} {...rise(index * 0.08)} className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_30px_90px_-46px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_90px_-42px_rgba(0,0,0,0.7)] sm:p-5 lg:p-7">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#90C898] to-transparent" />
                <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
                  <div className="px-3 py-4 sm:px-4 lg:py-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#90C898]/35 bg-[#90C898]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3d7348] dark:text-[#b9e5bf]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#90C898] shadow-[0_0_8px_#90C898]" />
                        {t.privateProduct}
                      </span>
                      <ProjectTypeBadges kinds={['app']} locale={locale} />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{project.title}</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white">{project.app.title}</h3>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-300/80">{project.app.description}</p>
                    <ul className="mt-6 space-y-3">
                      {project.app.details.map(detail => (
                        <li key={detail} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#90C898]/15">
                            <Check className="h-3.5 w-3.5 text-[#4b8b57] dark:text-[#90C898]" strokeWidth={3} />
                          </span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <Link href={getProjectPath(project.slug, locale)} className="group mt-7 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                      {t.appCaseStudy}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-2 px-1 text-right text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">{t.appPreview}</p>
                    <div className="relative aspect-[16/8] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-[#f6f7ef] shadow-[0_30px_80px_-38px_rgba(15,23,42,0.6)] dark:border-white/10 dark:shadow-[0_30px_80px_-34px_rgba(0,0,0,0.8)]">
                      <Image src={project.appShot || '/work-progreen-app-redacted.png'} alt={`${project.title} private operations app, with client data anonymized`} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover object-top" />
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
