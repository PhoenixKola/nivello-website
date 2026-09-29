import { CheckCircle2 } from 'lucide-react'
import FaqSection from '@/components/FaqSection'
import ProcessHeroGraphic from '@/components/ProcessHeroGraphic'
import Reveal from '@/components/Reveal'
import { getProcessStages } from '@/lib/process'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'How we work',
    titleStart: 'A clear process from ',
    titleAccent: 'first idea',
    titleEnd: ' to final launch.',
    intro: 'The details of every project change, but the way we collaborate stays predictable. Clear steps, focused checkpoints, and no messy handovers.'
  },
  it: {
    eyebrow: 'Metodo',
    titleStart: 'Un processo chiaro dalla ',
    titleAccent: 'prima idea',
    titleEnd: ' al lancio.',
    intro: 'I dettagli cambiano da progetto a progetto, ma la collaborazione resta prevedibile. Fasi chiare, checkpoint mirati e nessun passaggio caotico.'
  }
} satisfies Record<Locale, Record<string, string>>

export default function ProcessPage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const steps = getProcessStages(locale)

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-stone-50 outline-none dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
          <div className="nv-rise max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{t.eyebrow}</span>
            </div>
            <h1 className="font-display text-[2.35rem] font-bold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              {t.titleStart}
              <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.titleAccent}</span>
              {t.titleEnd}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.intro}</p>
          </div>
          <div className="nv-rise [--nv-rise-delay:0.1s] [--nv-rise-x:24px] [--nv-rise-y:0px]">
            <ProcessHeroGraphic locale={locale} />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <ol className="relative space-y-6 before:absolute before:left-5 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-slate-200 md:before:left-1/2 dark:before:bg-slate-700/70">
            {steps.map((step, index) => (
              <Reveal
                as="li"
                key={step.title}
                delay={index * 0.06}
                className={`relative grid gap-4 md:grid-cols-2 md:gap-10 ${index % 2 === 0 ? '' : 'md:[&>article]:col-start-2'}`}
              >
                <div className="absolute left-5 top-6 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-white shadow-sm md:left-1/2 dark:border-slate-900 dark:bg-slate-900">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: step.color }} />
                </div>
                <article className="ml-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:ml-0 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                      <step.icon aria-hidden="true" className="h-5 w-5" style={{ color: step.color }} />
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{step.duration}</span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{index + 1}</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{step.description}</p>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: step.color }} />
                    {step.clientView}
                  </p>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection locale={locale} />
    </main>
  )
}
