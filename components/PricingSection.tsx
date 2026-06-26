import { CheckCircle2 } from 'lucide-react'
import { pricing } from '@/lib/pricing'
import type { Locale } from '@/lib/site'

export default function PricingSection({ locale = 'en' }: { locale?: Locale }) {
  const content = pricing[locale]

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            {content.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {content.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
            {content.body}
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {content.packages.map(item => (
            <article key={item.name} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.name}</p>
              <p className="mt-3 font-display text-2xl font-semibold text-slate-900 dark:text-white">{item.range}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{item.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {item.items.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{content.note}</p>
      </div>
    </section>
  )
}
