'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ExternalLink, Lightbulb, Target, TrendingUp } from 'lucide-react'
import BottomCta from '@/components/BottomCta'
import type { Locale } from '@/lib/site'
import { getRoutePath } from '@/lib/site'
import { getProject, getProjectPath, getProjects } from '@/lib/projects'

const copy = {
  en: {
    back: 'Our work',
    liveSite: 'Visit live site',
    allWork: 'All projects',
    shipped: 'What we shipped',
    storyEyebrow: 'Behind the build',
    storyTitle: 'How the project came together',
    challenge: 'Challenge',
    solution: 'Solution',
    result: 'Result',
    similar: 'Want a similar result?',
    nextEyebrow: 'Next project',
    nextCta: 'View case study'
  },
  it: {
    back: 'Lavori',
    liveSite: 'Visita il sito live',
    allWork: 'Tutti i progetti',
    shipped: 'Cosa abbiamo realizzato',
    storyEyebrow: 'Dietro al progetto',
    storyTitle: 'Come è nato il progetto',
    challenge: 'Sfida',
    solution: 'Soluzione',
    result: 'Risultato',
    similar: 'Vuoi un risultato simile?',
    nextEyebrow: 'Progetto successivo',
    nextCta: 'Vedi il case study'
  }
} satisfies Record<Locale, Record<string, string>>

function getDomain(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}

export default function CaseStudyPage({ slug, locale = 'en' }: { slug: string; locale?: Locale }) {
  const project = getProject(slug, locale)
  const reducedMotion = useReducedMotion()
  if (!project) return null

  const t = copy[locale]
  const color = project.color
  const domain = getDomain(project.href)

  const siblings = getProjects(locale)
  const currentIndex = siblings.findIndex(item => item.slug === project.slug)
  const nextProject = siblings[(currentIndex + 1) % siblings.length]

  const story = [
    { title: t.challenge, body: project.challenge, Icon: Target },
    { title: t.solution, body: project.solution, Icon: Lightbulb },
    { title: t.result, body: project.result, Icon: TrendingUp }
  ]

  // `initial` must stay identical between server and client render, otherwise the
  // SSR'd opacity:0 would never be animated away for reduced-motion visitors.
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-90px' },
    transition: reducedMotion
      ? { duration: 0 }
      : { duration: 0.55, ease: 'easeOut' as const, delay }
  })

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95" style={{ ['--pc' as string]: color }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[62%] top-[-34%] h-[640px] w-[860px] -translate-x-1/2 rounded-full opacity-[0.22] blur-[130px] dark:opacity-[0.28]"
            style={{ background: `radial-gradient(circle, ${color} 0%, transparent 68%)` }}
          />
          <div
            className="absolute inset-0 opacity-40 dark:opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(100,116,139,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.14) 1px, transparent 1px)',
              backgroundSize: '58px 58px',
              maskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 35%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 35%, transparent 100%)'
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.65, ease: 'easeOut' }}
          >
            <Link
              href={getRoutePath('work', locale)}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t.back}
            </Link>

            <div className="mt-7 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }} />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{project.category}</p>
            </div>

            <h1 className="mt-3.5 font-display text-[2.9rem] font-bold leading-[0.98] tracking-tight text-slate-900 sm:text-6xl lg:text-[4rem] dark:text-white">
              {project.title}
            </h1>
            <div className="mt-5 h-1 w-14 rounded-full" style={{ backgroundColor: color }} />

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300/85">{project.desc}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {project.services.map(service => (
                <span
                  key={service}
                  className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 backdrop-blur transition-colors hover:border-[var(--pc)] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                >
                  {service}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(15,23,42,0.55)] dark:bg-white dark:text-slate-950"
              >
                {t.liveSite}
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                href={getRoutePath('work', locale)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
              >
                {t.allWork}
              </Link>
            </div>
          </motion.div>

          {/* Browser mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.75, ease: 'easeOut', delay: 0.12 }}
          >
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[2.5rem] opacity-45 blur-3xl dark:opacity-40"
              style={{ background: `radial-gradient(58% 58% at 50% 42%, ${color} 0%, transparent 72%)` }}
            />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_34px_90px_-28px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_34px_90px_-24px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.045]">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 dark:bg-slate-950/60 dark:text-slate-500">
                  {domain}
                </span>
              </div>
              <a href={project.href} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[16/10] overflow-hidden">
                <Image
                  src={project.shot}
                  alt={`${project.title} website`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Deliverables strip ───────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <motion.div
            {...rise()}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-3.5 dark:border-white/10">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.shipped}</p>
            </div>
            <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10">
              {project.details.map(detail => (
                <div key={detail} className="flex items-start gap-3 px-6 py-5">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)` }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color }} strokeWidth={3} />
                  </span>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────── */}
      <section className="relative border-t border-slate-200/70 dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div {...rise()} className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {t.storyEyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{t.storyTitle}</h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {story.map((item, i) => (
              <motion.article
                key={item.title}
                {...rise(i * 0.09)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--pc)] hover:shadow-[0_22px_60px_-24px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-4 -top-6 font-display text-[5.5rem] font-bold leading-none text-slate-900/[0.05] transition-colors duration-300 dark:text-white/[0.06]"
                >
                  {`0${i + 1}`}
                </span>
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
                >
                  <item.Icon className="h-5 w-5" style={{ color }} />
                </span>
                <h3 className="relative mt-5 font-display text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300/85">{item.body}</p>
              </motion.article>
            ))}
          </div>

          <motion.div {...rise(0.1)} className="mt-10 flex justify-center">
            <Link
              href={getRoutePath('contact', locale)}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-blue)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/40 hover:shadow dark:border-white/10 dark:bg-white/[0.03] dark:text-[var(--brand-gold)] dark:hover:border-[var(--brand-gold)]/40"
            >
              {t.similar}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Next project ─────────────────────────────────────── */}
      {nextProject && nextProject.slug !== project.slug && (
        <section className="relative border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <motion.div {...rise()}>
              <Link
                href={getProjectPath(nextProject.slug, locale)}
                className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--npc)] hover:shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] md:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
                style={{ ['--npc' as string]: nextProject.color }}
              >
                <div className="flex flex-col justify-center gap-3 p-7 lg:p-9">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: nextProject.color }} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.nextEyebrow}</p>
                  </div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    {nextProject.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300/85">{nextProject.body}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.nextCta}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
                <div className="relative order-first aspect-[16/10] overflow-hidden md:order-last md:aspect-auto md:min-h-[260px]">
                  <Image
                    src={nextProject.shot}
                    alt={`${nextProject.title} website`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <BottomCta locale={locale} />
    </main>
  )
}
