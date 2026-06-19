import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import { pageSeo } from '../../seo'

export const metadata: Metadata = pageSeo.aboutIt

const principles = [
  { title: 'Prima la strategia', body: 'Definiamo il ruolo del sito prima di scegliere layout o linguaggio visivo.', icon: Compass, color: 'var(--brand-gold)' },
  { title: 'Chiarezza marketing', body: 'Messaggio, offerta e call to action restano vicini all’obiettivo business.', icon: Megaphone, color: 'var(--brand-blue)' },
  { title: 'Design curato', body: 'Manteniamo interfacce calme, premium e facili da leggere su ogni dispositivo.', icon: Palette, color: 'var(--brand-purple)' },
  { title: 'Sviluppo moderno', body: 'Next.js, React e implementazione pulita rendono il sito veloce e mantenibile.', icon: Code2, color: 'var(--brand-blue)' }
]

export default function AboutItPage() {
  return (
    <main className="bg-white dark:bg-ink">
      <section className="border-b border-slate-100 bg-stone-50 dark:border-white/10 dark:bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">Chi siamo</p>
          <h1 className="max-w-3xl font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Un piccolo studio italiano per una presenza digitale piu chiara.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
            Nivello unisce strategia, marketing, design e sviluppo per brand che vogliono un sito premium e facile da capire. Manteniamo il team snello, il processo strutturato e l’esecuzione concentrata.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-20 md:grid-cols-2 lg:grid-cols-4 md:py-28">
          {principles.map(item => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                <item.icon className="h-5 w-5" style={{ color: item.color }} />
              </span>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-ink-soft">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Link href="/it/process" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            Scopri come lavoriamo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
