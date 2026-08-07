import { ArrowUpRight, Check, FileCheck2, LayoutPanelTop } from 'lucide-react'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Project route',
    title: 'Every decision has a place.',
    status: 'In review',
    stages: ['Direction', 'Scope', 'Design', 'Build', 'Launch'],
    active: 'Design system & key screens',
    ready: 'Ready for your review',
    deliverable: 'Homepage direction · v02',
    next: 'Next checkpoint',
    nextValue: 'Build approval'
  },
  it: {
    eyebrow: 'Percorso progetto',
    title: 'Ogni decisione ha il suo posto.',
    status: 'In revisione',
    stages: ['Direzione', 'Scope', 'Design', 'Sviluppo', 'Lancio'],
    active: 'Design system e schermate chiave',
    ready: 'Pronto per la revisione',
    deliverable: 'Direzione homepage · v02',
    next: 'Prossimo checkpoint',
    nextValue: 'Approvazione sviluppo'
  }
} satisfies Record<Locale, Record<string, string | string[]>>

const colors = [
  'var(--brand-gold)',
  'var(--brand-blue)',
  'var(--brand-purple)',
  'var(--brand-pink)',
  'var(--brand-gold)'
]

export default function ProcessHeroGraphic({ locale }: { locale: Locale }) {
  const content = copy[locale]
  const stages = content.stages as string[]

  return (
    <div className="relative overflow-hidden border border-slate-200 bg-white p-4 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.35)] sm:p-5 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
      <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-4 dark:border-white/10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)] dark:text-sky-400">
            {content.eyebrow as string}
          </p>
          <p className="mt-1.5 max-w-xs text-lg font-semibold leading-tight text-slate-900 dark:text-white">
            {content.title as string}
          </p>
        </div>
        <LayoutPanelTop className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.82fr_1.18fr]">
        <div className="border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-slate-950/45">
          {stages.map((stage, index) => {
            const active = index === 2
            return (
              <div
                key={stage}
                className={`flex items-center gap-3 border-b border-slate-200 py-3 last:border-b-0 dark:border-white/10 ${active ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <span className="h-7 w-1 shrink-0" style={{ backgroundColor: colors[index], opacity: active ? 1 : 0.42 }} />
                <span className="w-5 text-[10px] font-semibold tabular-nums">0{index + 1}</span>
                <span className="text-xs font-semibold">{stage}</span>
              </div>
            )
          })}
        </div>

        <div className="flex min-w-0 flex-col border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="border border-purple-200 bg-purple-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-purple-700 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300">
              03 / 05
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {content.status as string}
            </span>
          </div>

          <p className="mt-5 text-base font-semibold leading-snug text-slate-900 dark:text-white">
            {content.active as string}
          </p>

          <div className="mt-4 border-l-2 border-[var(--brand-purple)] bg-slate-50 p-3 dark:bg-white/[0.04]">
            <div className="flex gap-3">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-purple)]" />
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                  {content.ready as string}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {content.deliverable as string}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                {content.next as string}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{content.nextValue as string}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-900 text-white dark:bg-white dark:text-slate-950">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 border border-slate-200 dark:border-white/10">
        {[
          ['01', locale === 'it' ? 'Allineato' : 'Aligned'],
          ['02', locale === 'it' ? 'Approvato' : 'Approved'],
          ['03', locale === 'it' ? 'Visibile' : 'Visible']
        ].map(([number, label], index) => (
          <div key={number} className="flex items-center gap-2 border-r border-slate-200 px-3 py-2.5 last:border-r-0 dark:border-white/10">
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: colors[index] }} />
            <span className="hidden text-[10px] font-semibold text-slate-500 sm:inline dark:text-slate-400">{label}</span>
            <span className="ml-auto text-[9px] font-bold text-slate-300 dark:text-slate-600">{number}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
