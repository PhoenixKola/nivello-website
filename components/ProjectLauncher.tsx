'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import {
  briefCopy,
  buildOptions,
  describeBrief,
  getBriefContactHref,
  stageOptions,
  type BuildOption,
  type ProjectBrief,
  type StageOption
} from '@/lib/projectBrief'
import { track } from '@/lib/analytics'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Start a project',
    title: 'Two quick answers, and your project is already taking shape.',
    body: 'Pick what you are building and where you are starting from. We carry it straight into the contact form, so you do not have to explain it twice.',
    step1: 'What are we building?',
    step2: 'Where are you starting from?',
    cta: 'Start this project',
    idle: 'Choose both to shape your brief.',
    partial: 'One more answer.',
    ready: 'Brief ready:',
    rail: ['Select', 'Assemble', 'Launch'],
    note: 'Prefer to skip this? The contact form works without it.'
  },
  it: {
    eyebrow: 'Avvia un progetto',
    title: 'Due risposte veloci, e il progetto prende già forma.',
    body: 'Scegli cosa stai costruendo e da dove parti. Lo portiamo direttamente nel form di contatto, così non devi spiegarlo due volte.',
    step1: 'Cosa costruiamo?',
    step2: 'Da dove partiamo?',
    cta: 'Avvia questo progetto',
    idle: 'Scegli entrambe le opzioni per definire il brief.',
    partial: 'Manca una risposta.',
    ready: 'Brief pronto:',
    rail: ['Scegli', 'Componi', 'Lancia'],
    note: 'Preferisci saltare? Il form di contatto funziona anche senza.'
  }
} satisfies Record<Locale, Record<string, unknown>>

type Rect = [number, number, number, number]

// Blueprint modules drawn inside the 320×170 frame for each "what are we building" answer.
const layouts: Record<BuildOption | 'empty', { bar: boolean; modules: Rect[] }> = {
  empty: { bar: false, modules: [] },
  website: {
    bar: true,
    modules: [
      [28, 42, 150, 44],
      [190, 42, 102, 44],
      [28, 98, 82, 56],
      [119, 98, 82, 56],
      [210, 98, 82, 56]
    ]
  },
  app: {
    bar: true,
    modules: [
      [28, 42, 54, 112],
      [94, 42, 94, 40],
      [198, 42, 94, 40],
      [94, 94, 198, 60]
    ]
  },
  unsure: {
    bar: false,
    modules: [
      [40, 36, 110, 46],
      [170, 52, 110, 40],
      [70, 104, 180, 46]
    ]
  }
}

function Blueprint({ brief, reduced }: { brief: ProjectBrief; reduced: boolean }) {
  const layout = layouts[brief.build ?? 'empty']
  const solid = brief.build !== null && brief.build !== 'unsure'
  const draw = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] as const }
        }
  const highlight = layout.modules.length > 1 ? layout.modules[layout.modules.length - 1] : null

  return (
    <svg viewBox="0 0 320 170" className="h-auto w-full" aria-hidden="true" fill="none">
      <rect
        x="12"
        y="10"
        width="296"
        height="152"
        rx="8"
        className="stroke-slate-300 transition-[stroke-dasharray] dark:stroke-white/20"
        strokeWidth="1.5"
        strokeDasharray={brief.build ? '0' : '5 5'}
      />

      <AnimatePresence>
        {layout.bar && (
          <motion.g key={`bar-${brief.build}`} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>
            <motion.line x1="12" y1="30" x2="308" y2="30" className="stroke-slate-300 dark:stroke-white/20" strokeWidth="1.5" {...draw(0)} />
            {[24, 34, 44].map(cx => (
              <motion.circle key={cx} cx={cx} cy="20" r="2.6" className="fill-slate-300 dark:fill-white/25" {...draw(0.05)} />
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* redesign: the previous version sits ghosted behind the new structure */}
      <AnimatePresence>
        {brief.stage === 'redesign' &&
          layout.modules.map(([x, y, w, h], i) => (
            <motion.rect
              key={`ghost-${brief.build}-${i}`}
              x={x + 7}
              y={y + 6}
              width={w}
              height={h}
              rx="4"
              className="stroke-[var(--brand-purple)]"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeDasharray="3 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : i * 0.03 }}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.g key={`modules-${brief.build ?? 'empty'}`} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
          {layout.modules.map(([x, y, w, h], i) => (
            <motion.rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="4"
              className={
                brief.stage === 'new'
                  ? 'fill-[var(--brand-blue)]/10 stroke-[var(--brand-blue)]'
                  : 'fill-slate-100 stroke-slate-400 dark:fill-white/[0.04] dark:stroke-white/35'
              }
              strokeWidth="1.5"
              strokeDasharray={solid ? '0' : '4 4'}
              {...draw(0.08 + i * 0.07)}
            />
          ))}
          {brief.build === 'unsure' && (
            <motion.text
              x="160"
              y="95"
              textAnchor="middle"
              className="fill-slate-400 font-display text-[28px] dark:fill-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.3 }}
            >
              ?
            </motion.text>
          )}
        </motion.g>
      </AnimatePresence>

      {/* improve: one existing module gets upgraded */}
      <AnimatePresence>
        {brief.stage === 'improve' && highlight && (
          <motion.g
            key={`improve-${brief.build}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.2 }}
          >
            <rect
              x={highlight[0] - 4}
              y={highlight[1] - 4}
              width={highlight[2] + 8}
              height={highlight[3] + 8}
              rx="6"
              className="stroke-[var(--brand-gold)]"
              strokeWidth="2"
            />
            <circle cx={highlight[0] + highlight[2]} cy={highlight[1] - 4} r="9" className="fill-[var(--brand-gold)]" />
            <path
              d={`M${highlight[0] + highlight[2]} ${highlight[1] + 0.5} v-9 m-3.5 3.5 l3.5 -3.5 l3.5 3.5`}
              className="stroke-slate-950"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

function OptionButton({
  label,
  hint,
  selected,
  onClick
}: {
  label: string
  hint: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] dark:focus-visible:outline-[var(--brand-gold)] ${
        selected
          ? 'border-slate-900 bg-white ring-1 ring-slate-900 dark:border-[var(--brand-gold)] dark:bg-white/[0.06] dark:ring-[var(--brand-gold)]'
          : 'border-slate-200 bg-white/60 hover:border-slate-400 dark:border-white/12 dark:bg-white/[0.02] dark:hover:border-white/30'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? 'border-slate-900 bg-slate-900 text-white dark:border-[var(--brand-gold)] dark:bg-[var(--brand-gold)] dark:text-slate-950'
            : 'border-slate-300 dark:border-white/25'
        }`}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
    </button>
  )
}

export default function ProjectLauncher({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const labels = briefCopy[locale]
  const reduced = Boolean(useReducedMotion())
  const headingId = useId()
  const step1Id = useId()
  const step2Id = useId()
  const [brief, setBrief] = useState<ProjectBrief>({ build: null, stage: null })

  const phase = (brief.build ? 1 : 0) + (brief.stage ? 1 : 0)
  const status = phase === 2 ? `${t.ready} ${describeBrief(brief, locale)}` : phase === 1 ? t.partial : t.idle

  const noteStart = () => {
    if (!brief.build && !brief.stage) track('project_launcher_start')
  }
  const toggleBuild = (value: BuildOption) => {
    noteStart()
    setBrief(prev => ({ ...prev, build: prev.build === value ? null : value }))
  }
  const toggleStage = (value: StageOption) => {
    noteStart()
    setBrief(prev => ({ ...prev, stage: prev.stage === value ? null : value }))
  }

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95" aria-labelledby={headingId}>
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            {t.eyebrow}
          </p>
          <h2
            id={headingId}
            className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white"
          >
            {t.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.body}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="space-y-8">
            <div role="group" aria-labelledby={step1Id}>
              <p id={step1Id} className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="text-[11px] tabular-nums tracking-[0.16em] text-slate-400 dark:text-slate-500">01</span>
                {t.step1}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {buildOptions.map(option => (
                  <OptionButton
                    key={option}
                    {...labels.build[option]}
                    selected={brief.build === option}
                    onClick={() => toggleBuild(option)}
                  />
                ))}
              </div>
            </div>

            <div role="group" aria-labelledby={step2Id}>
              <p id={step2Id} className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="text-[11px] tabular-nums tracking-[0.16em] text-slate-400 dark:text-slate-500">02</span>
                {t.step2}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {stageOptions.map(option => (
                  <OptionButton
                    key={option}
                    {...labels.stage[option]}
                    selected={brief.stage === option}
                    onClick={() => toggleStage(option)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:row-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.025]">
              <Blueprint brief={brief} reduced={reduced} />

              <ol className="mt-4 grid grid-cols-3 items-center" aria-hidden="true">
                {t.rail.map((label, index) => {
                  const lit = index <= phase
                  return (
                    <li key={label} className="relative flex flex-col items-center gap-1.5">
                      {index > 0 && (
                        <span className="absolute right-1/2 top-[5px] h-px w-full bg-slate-200 dark:bg-white/10">
                          <motion.span
                            className="block h-full origin-left bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]"
                            initial={false}
                            animate={{ scaleX: index <= phase ? 1 : 0 }}
                            transition={{ duration: reduced ? 0 : 0.4 }}
                          />
                        </span>
                      )}
                      <span
                        className={`relative z-10 h-[11px] w-[11px] rounded-full border-2 transition-colors ${
                          lit
                            ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] dark:border-[var(--brand-gold)] dark:bg-[var(--brand-gold)]'
                            : 'border-slate-300 bg-stone-50 dark:border-white/25 dark:bg-slate-950'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          lit ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-start-1">
            <Link
              href={getBriefContactHref(brief, locale)}
              onClick={() => track('project_launcher_complete', brief.build && brief.stage ? `${brief.build}_${brief.stage}` : 'partial')}
              className={`group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-all sm:w-auto ${
                phase === 2
                  ? 'bg-slate-900 text-white shadow-[0_14px_34px_-14px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-[var(--brand-gold)] dark:text-slate-950 dark:shadow-none dark:hover:bg-yellow-300'
                  : 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:border-[var(--brand-gold)]/55 dark:hover:bg-white/[0.06]'
              }`}
            >
              {t.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="min-w-0">
              <p aria-live="polite" className="min-h-5 text-sm font-medium text-slate-700 dark:text-slate-200">
                {status}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
