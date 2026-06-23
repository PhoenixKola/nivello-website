import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react'

export default function BottomCta() {
  return (
    <section className="bg-stone-50 dark:bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-stone-50 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:grid-cols-[1fr_0.42fr] md:p-9 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
          <div className="flex flex-col justify-between gap-8">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
                Let&apos;s collaborate
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Ready to launch something new for the Italian market?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                Tell us what you are building, where you are now, and what needs to happen next. We will come back with a practical direction, not a generic pitch.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:border-[var(--brand-gold)]/55 dark:hover:bg-white/[0.06]"
            >
              Book a call
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Clock3 className="h-4 w-4 text-[var(--brand-gold)]" />
              Typical engagement
            </div>
            <div className="mt-5 space-y-4">
              {['Strategy and scope alignment', 'Design direction and key pages', 'Next.js build and launch support'].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Most website projects run in focused stages, with clear checkpoints and room for practical decisions.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
