'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, X } from 'lucide-react'
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
import { useHydratedReducedMotion } from '@/lib/useHydratedReducedMotion'

const copy = {
  en: {
    chapter: 'Make it real',
    eyebrow: 'Start a project',
    title: 'Two quick answers, and your project is already taking shape.',
    body: 'Pick what you are building and where you are starting from. We carry it straight into the contact form, so you do not have to explain it twice.',
    step1: 'What are we building?',
    step2: 'Where are you starting from?',
    cta: 'Start this project',
    open: 'Shape your brief',
    close: 'Close brief',
    drawer: 'Project brief',
    idle: 'Choose both to shape your brief.',
    partial: 'One more answer.',
    ready: 'Brief ready:',
    rail: ['Select', 'Assemble', 'Launch'],
    note: 'Prefer to skip this? The contact form works without it.'
  },
  it: {
    chapter: 'Rendilo reale',
    eyebrow: 'Avvia un progetto',
    title: 'Due risposte veloci, e il progetto prende già forma.',
    body: 'Scegli cosa stai costruendo e da dove parti. Lo portiamo direttamente nel form di contatto, così non devi spiegarlo due volte.',
    step1: 'Cosa costruiamo?',
    step2: 'Da dove partiamo?',
    cta: 'Avvia questo progetto',
    open: 'Definisci il brief',
    close: 'Chiudi il brief',
    drawer: 'Brief del progetto',
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
  variant,
  onClick
}: {
  label: string
  hint: string
  selected: boolean
  variant: 'build' | 'stage'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`project-option project-option--${variant}`}
    >
      <span
        aria-hidden="true"
        className="project-option-check"
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="project-option-label">{label}</span>
        <span className="project-option-hint">{hint}</span>
      </span>
    </button>
  )
}

export default function ProjectLauncher({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const labels = briefCopy[locale]
  const reduced = useHydratedReducedMotion()
  const headingId = useId()
  const step1Id = useId()
  const step2Id = useId()
  const drawerId = useId()
  const [brief, setBrief] = useState<ProjectBrief>({ build: null, stage: null })
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  const phase = (brief.build ? 1 : 0) + (brief.stage ? 1 : 0)
  const status = phase === 2 ? `${t.ready} ${describeBrief(brief, locale)}` : phase === 1 ? t.partial : t.idle

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    drawerRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
    <section id="cinematic-start" className="cin-ov cin-ov--start" data-cin-overlay="4" aria-labelledby={headingId}>
      <div className="cin-start">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">05</span>{t.chapter}<span className="cin-head__sep" aria-hidden="true" />{t.eyebrow}</p>
        <h2 id={headingId} className="cin-start__title">{t.title}</h2>
        <p className="cin-start__body">{t.body}</p>

        <div className="cin-start__actions">
          <Link
            href={getBriefContactHref(brief, locale)}
            onClick={() => track('project_launcher_complete', brief.build && brief.stage ? `${brief.build}_${brief.stage}` : 'partial')}
            className={`cin-btn ${phase === 2 ? 'cin-btn--gold' : 'cin-btn--solid'}`}
          >
            {t.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="cin-btn cin-btn--ghost cin-start__toggle"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen(value => !value)}
          >
            {open ? t.close : t.open}
          </button>
        </div>
        <p aria-live="polite" className="cin-start__status">{status}</p>
        <p className="cin-start__note">{t.note}</p>
      </div>

      <aside ref={drawerRef} id={drawerId} className="cin-drawer" data-open={open ? 'true' : 'false'} aria-label={t.drawer}>
        <button type="button" className="cin-drawer__close" onClick={() => { setOpen(false); toggleRef.current?.focus() }} aria-label={t.close}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="project-launcher-steps" data-progress={phase}>
          <div className={`project-launcher-step ${brief.build ? 'is-complete' : 'is-active'}`} role="group" aria-labelledby={step1Id}>
            <p id={step1Id} className="cin-drawer__step">
              <span className="project-launcher-step-number">01</span>
              {t.step1}
            </p>
            <div className="cin-drawer__options">
              {buildOptions.map(option => (
                <OptionButton
                  key={option}
                  {...labels.build[option]}
                  selected={brief.build === option}
                  variant="build"
                  onClick={() => toggleBuild(option)}
                />
              ))}
            </div>
          </div>

          <div className={`project-launcher-step ${brief.stage ? 'is-complete' : brief.build ? 'is-active' : ''}`} role="group" aria-labelledby={step2Id}>
            <p id={step2Id} className="cin-drawer__step">
              <span className="project-launcher-step-number">02</span>
              {t.step2}
            </p>
            <div className="cin-drawer__options">
              {stageOptions.map(option => (
                <OptionButton
                  key={option}
                  {...labels.stage[option]}
                  selected={brief.stage === option}
                  variant="stage"
                  onClick={() => toggleStage(option)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="cin-drawer__preview">
          <Blueprint brief={brief} reduced={reduced} />
          <ol className="cin-drawer__rail" aria-hidden="true">
            {t.rail.map((label, index) => (
              <li key={label} data-lit={index <= phase ? 'true' : 'false'}>
                <span />
                {label}
              </li>
            ))}
          </ol>
        </div>

        <Link
          href={getBriefContactHref(brief, locale)}
          onClick={() => track('project_launcher_complete', brief.build && brief.stage ? `${brief.build}_${brief.stage}` : 'partial')}
          className={`cin-btn ${phase === 2 ? 'cin-btn--gold' : 'cin-btn--solid'} cin-drawer__cta`}
        >
          {t.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </aside>
    </section>
  )
}
