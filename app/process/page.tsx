'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const steps = [
  {
    title: 'Intro call and fit check',
    description: 'We talk about your brand, goals, constraints, and what a good outcome looks like in your context.',
    clientView: 'You speak directly with the people doing the work, not a sales team. We give you a first idea of scope and timing.',
    duration: '30–45 minutes',
    accent: 'emerald'
  },
  {
    title: 'Scope, plan, and proposal',
    description: 'We outline deliverables, milestones, and responsibilities so everyone knows what will happen and when.',
    clientView: 'You receive a clear proposal you can review internally, including timeline, investment, and decision points.',
    duration: '3–5 days',
    accent: 'sky'
  },
  {
    title: 'Design and content',
    description: 'We shape the structure, flows, and visual language. Content and copy are refined in parallel with design.',
    clientView: 'You review layouts and key screens in Figma or similar, give focused feedback, and see iterations quickly.',
    duration: '1–3 weeks depending on scope',
    accent: 'fuchsia'
  },
  {
    title: 'Build and implementation',
    description: 'We implement the approved designs using modern front-end tools, keeping performance and accessibility in mind.',
    clientView: 'You see regular previews on a staging URL and can test the experience on desktop and mobile before launch.',
    duration: '1–2 weeks for most marketing sites',
    accent: 'emerald'
  },
  {
    title: 'Launch and refinement',
    description: 'We launch the site, monitor key metrics, and make small adjustments based on real usage.',
    clientView: 'You get a stable launch, documentation for the essentials, and the option to keep us as a partner for future iterations.',
    duration: 'First 1–2 weeks after launch',
    accent: 'sky'
  }
]

const accentRing: Record<string, string> = {
  emerald: 'ring-emerald-300 bg-emerald-50 text-emerald-700 dark:ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'ring-sky-300 bg-sky-50 text-sky-700 dark:ring-sky-500/50 dark:bg-sky-500/15 dark:text-sky-300',
  fuchsia: 'ring-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:ring-fuchsia-500/50 dark:bg-fuchsia-500/15 dark:text-fuchsia-300'
}

const miniStepItems = [
  { label: 'Discover', icon: '🔍' },
  { label: 'Design', icon: '✏️' },
  { label: 'Build', icon: '⚡' },
  { label: 'Launch', icon: '🚀' },
  { label: 'Improve', icon: '📈' }
]

export default function ProcessPage() {
  return (
    <div className="bg-white dark:bg-slate-950">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/7 blur-[120px] dark:bg-sky-500/8" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] translate-x-1/3 -translate-y-1/3 rounded-full bg-fuchsia-400/6 blur-[100px] dark:bg-fuchsia-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">How we work</span>
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3rem] dark:text-slate-50">
                A clear process from{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 55%, #059669 100%)' }}
                >
                  first idea
                </span>{' '}
                to final launch.
              </h1>

              <p className="mb-7 max-w-[480px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
                The details of every project change, but the way we collaborate stays predictable. No endless calls, no messy handovers. Just clear steps.
              </p>

              <Link href="/contact" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
                Start the process
              </Link>
            </motion.div>

            {/* Right: mini step flow */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              {miniStepItems.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 + i * 0.1 }}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">0{i + 1}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.label}</span>
                  </div>
                  {i < miniStepItems.length - 1 && (
                    <div className="ml-auto h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Detailed step timeline ───────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <ol className="space-y-8 border-l-2 border-slate-200 pl-10 md:space-y-10 md:pl-12 dark:border-slate-800">
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                className="relative"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className={`absolute -left-[34px] mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 md:-left-10 ${accentRing[step.accent]}`}>
                  {index + 1}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
                  <div className="md:basis-1/2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{step.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{step.description}</p>
                  </div>
                  <div className="md:basis-1/2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">What you see</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{step.clientView}</p>
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Approx. duration: {step.duration}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-950/90">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Next step</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
                  Share a short brief and we will map the project for you.
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  You do not need a perfect document. A few paragraphs about your brand, product, and goals are enough to start.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link href="/contact" className="rounded-full bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
                  Start the process
                </Link>
                <p className="text-xs text-slate-400 dark:text-slate-500">We usually reply within one business day.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
