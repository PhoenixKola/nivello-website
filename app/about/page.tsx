import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import { pageSeo } from '../seo'

export const metadata: Metadata = pageSeo.about

const principles = [
  { title: 'Strategy first', body: 'We define the job of the site before choosing layouts or visual language.', icon: Compass, color: 'var(--brand-gold)' },
  { title: 'Marketing clarity', body: 'The message, offer, and calls to action stay close to the business goal.', icon: Megaphone, color: 'var(--brand-blue)' },
  { title: 'Polished design', body: 'We keep interfaces calm, premium, and easy to scan across devices.', icon: Palette, color: 'var(--brand-purple)' },
  { title: 'Modern build', body: 'Next.js, React, and clean implementation keep the site fast and maintainable.', icon: Code2, color: 'var(--brand-blue)' }
]

export default function AboutPage() {
  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">About</p>
          <h1 className="max-w-3xl font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            A small Italy-based studio for sharper digital presence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
            Nivello combines strategy, marketing, design, and development for brands that want a site that feels premium and works clearly. We keep the team lean, the process structured, and the execution focused.
          </p>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
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

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Link href="/process" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            See how we work
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
