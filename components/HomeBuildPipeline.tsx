'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Transition } from 'framer-motion'
import { ArrowUpRight, Check, Target } from 'lucide-react'
import { getProcessStages } from '@/lib/process'
import { getRoutePath, type Locale } from '@/lib/site'

/**
 * Build Pipeline — the homepage process section.
 *
 * One artifact evolves through the five real workflow stages while a progress
 * rail advances beside the checkpoints (CONNECT -> ADVANCE -> LOCK -> RESOLVE).
 * The active stage is derived from scroll position, so ordinary scrolling drives
 * it — nothing is pinned and the page is never scroll-jacked.
 *
 * Without JS every stage is still rendered and readable; only the highlight and
 * the artifact's state depend on it.
 */

const copy = {
  en: {
    eyebrow: 'Process',
    title: 'One project, five clear stages.',
    intro: 'The same pipeline runs behind every Nivello project: from a first conversation to a live product that keeps improving.',
    link: 'See how we work',
    artifactLabel: 'Project',
    live: 'Live'
  },
  it: {
    eyebrow: 'Metodo',
    title: 'Un progetto, cinque fasi chiare.',
    intro: 'Dietro ogni progetto Nivello c’è lo stesso percorso: dalla prima conversazione a un prodotto live che continua a migliorare.',
    link: 'Scopri come lavoriamo',
    artifactLabel: 'Progetto',
    live: 'Live'
  }
} satisfies Record<Locale, Record<string, string>>

/** One artifact, accumulating detail as the pipeline advances. */
function ProjectArtifact({
  stage,
  liveLabel,
  titleLabel,
  compact = false
}: {
  stage: number
  liveLabel: string
  titleLabel: string
  compact?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const ease: Transition = reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }
  const at = (from: number) => (stage >= from ? 1 : 0)

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(0,0,0,0.9)] ${
        compact ? '' : 'w-full'
      }`}
    >
      {/* chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="ml-2 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">{titleLabel}</span>
        <motion.span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400"
          initial={false}
          animate={{ opacity: at(5), scale: stage >= 5 ? 1 : 0.9 }}
          transition={ease}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {liveLabel}
        </motion.span>
      </div>

      <div className={`relative ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
        {/* stage 1 — brief target badge */}
        <motion.span
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]"
          initial={false}
          animate={{ opacity: stage === 1 ? 1 : 0 }}
          transition={ease}
        >
          <Target className="h-4 w-4" />
        </motion.span>

        {/* always present: heading + copy */}
        <span className={`block rounded-full bg-slate-300 dark:bg-slate-600 ${compact ? 'h-2 w-[54%]' : 'h-2.5 w-[52%]'}`} />
        <span className={`mt-2 block rounded-full bg-slate-200 dark:bg-slate-700/70 ${compact ? 'h-1.5 w-[86%]' : 'h-2 w-[84%]'}`} />
        <span className={`mt-1.5 block rounded-full bg-slate-200 dark:bg-slate-700/70 ${compact ? 'h-1.5 w-[64%]' : 'h-2 w-[62%]'}`} />

        {/* stage 2 — milestone rail */}
        <motion.div
          className="mt-3 overflow-hidden"
          initial={false}
          animate={{ opacity: at(2), height: stage >= 2 ? 'auto' : 0 }}
          transition={ease}
        >
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="flex flex-1 items-center gap-1.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    index === 0 ? 'bg-[var(--brand-blue)]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                {index < 3 && <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* stage 3 — layout blocks, coloured from stage 4 */}
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ opacity: at(3), height: stage >= 3 ? 'auto' : 0 }}
          transition={ease}
        >
          <div className={`grid grid-cols-3 gap-1.5 ${compact ? 'mt-3' : 'mt-4'}`}>
            <motion.span
              className={`col-span-2 block rounded-md ${compact ? 'h-10' : 'h-14'}`}
              initial={false}
              animate={{ backgroundColor: stage >= 4 ? 'rgba(21,155,255,0.85)' : 'rgba(148,163,184,0.35)' }}
              transition={ease}
            />
            <motion.span
              className={`block rounded-md ${compact ? 'h-10' : 'h-14'}`}
              initial={false}
              animate={{ backgroundColor: stage >= 4 ? 'rgba(124,58,237,0.7)' : 'rgba(148,163,184,0.25)' }}
              transition={ease}
            />
          </div>

          <div className={`flex items-center gap-2 ${compact ? 'mt-2.5' : 'mt-3'}`}>
            <span
              className={`block rounded-full transition-colors duration-300 ${compact ? 'h-5 w-16' : 'h-6 w-20'} ${
                stage >= 4 ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <motion.span
              className="inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--brand-blue)] dark:border-white/15 dark:text-[var(--brand-gold)]"
              initial={false}
              animate={{ opacity: at(4) }}
              transition={ease}
            >
              &lt;/&gt;
            </motion.span>
            <motion.span
              className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
              initial={false}
              animate={{ opacity: at(5), scale: stage >= 5 ? 1 : 0.7 }}
              transition={ease}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </motion.span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function HomeBuildPipeline({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const stages = getProcessStages(locale)
  const reducedMotion = useReducedMotion()
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(1)

  // The active checkpoint is whichever sits closest to the middle of the
  // viewport, so ordinary scrolling advances the pipeline. No pinning.
  useEffect(() => {
    const update = () => {
      const middle = window.innerHeight / 2
      let best = 1
      let bestDistance = Number.POSITIVE_INFINITY

      itemRefs.current.forEach((node, index) => {
        if (!node) return
        const rect = node.getBoundingClientRect()
        const distance = Math.abs(rect.top + rect.height / 2 - middle)
        if (distance < bestDistance) {
          bestDistance = distance
          best = index + 1
        }
      })

      setActive(best)
    }

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const ease: Transition = reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }
  const progress = ((active - 1) / (stages.length - 1)) * 100

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95" aria-labelledby="home-process-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {t.eyebrow}
            </p>
            <h2
              id="home-process-heading"
              className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white"
            >
              {t.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.intro}</p>
          </div>
          <Link
            href={getRoutePath('process', locale)}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:text-blue-600 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300"
          >
            {t.link}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:gap-14">
          {/* sticky evolving artifact — desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <ProjectArtifact stage={active} liveLabel={t.live} titleLabel={t.artifactLabel} />
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={ease}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
                  {String(active).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* checkpoints */}
          <ol className="relative">
            {/* rail */}
            <span
              aria-hidden="true"
              className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-white/12"
            />
            <motion.span
              aria-hidden="true"
              className="absolute left-[15px] top-2 w-px origin-top bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]"
              initial={false}
              animate={{ height: `calc((100% - 1rem) * ${progress / 100})` }}
              transition={ease}
            />

            {stages.map((stage, index) => {
              const number = index + 1
              const isActive = number === active
              const isDone = number < active

              return (
                <li
                  key={stage.id}
                  ref={node => {
                    itemRefs.current[index] = node
                  }}
                  className="relative pb-8 pl-12 last:pb-0"
                >
                  <motion.span
                    aria-hidden="true"
                    className={`absolute left-0 top-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                      isActive
                        ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white dark:border-[var(--brand-gold)] dark:bg-[var(--brand-gold)] dark:text-slate-950'
                        : isDone
                          ? 'border-slate-300 bg-white text-slate-500 dark:border-white/25 dark:bg-slate-900 dark:text-slate-300'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-white/12 dark:bg-slate-900 dark:text-slate-500'
                    }`}
                    initial={false}
                    animate={{ scale: isActive && !reducedMotion ? 1.06 : 1 }}
                    transition={ease}
                  >
                    {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : String(number).padStart(2, '0')}
                  </motion.span>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3
                      className={`font-display text-lg font-semibold transition-colors sm:text-xl ${
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{stage.duration}</span>
                  </div>

                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">
                    {stage.short}
                  </p>

                  {/* artifact travels with the active phase on small screens */}
                  <motion.div
                    className="overflow-hidden lg:hidden"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, height: isActive ? 'auto' : 0 }}
                    transition={ease}
                  >
                    <div className="pt-4">
                      <ProjectArtifact stage={number} liveLabel={t.live} titleLabel={t.artifactLabel} compact />
                    </div>
                  </motion.div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
