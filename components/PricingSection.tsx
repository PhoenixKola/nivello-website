import Link from 'next/link'
import { ArrowRight, Blocks, Check, PanelsTopLeft, Rocket } from 'lucide-react'
import { pricing } from '@/lib/pricing'
import { getRoutePath, type Locale } from '@/lib/site'

const icons = [Rocket, PanelsTopLeft, Blocks]
const accents = ['var(--brand-gold)', 'var(--brand-blue)', 'var(--brand-purple)']

const copy = {
  en: { recommended: 'Most chosen', cta: 'Discuss this package' },
  it: { recommended: 'Piu scelto', cta: 'Parliamo del pacchetto' }
} satisfies Record<Locale, Record<string, string>>

export default function PricingSection({ locale = 'en' }: { locale?: Locale }) {
  const content = pricing[locale]
  const t = copy[locale]

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="mb-14 grid gap-5 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{content.eyebrow}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{content.title}</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 md:pb-1 dark:text-slate-300/80">{content.body}</p>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {content.packages.map((item, index) => {
            const Icon = icons[index]
            const accent = accents[index]
            const featured = index === 1
            return (
              <article
                key={item.name}
                className={`group relative flex min-h-[460px] flex-col overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--package-accent)] hover:shadow-[0_26px_70px_-36px_rgba(15,23,42,0.45)] dark:bg-white/[0.03] dark:shadow-none dark:hover:border-[var(--package-accent)] sm:p-7 ${featured ? 'border-[var(--brand-blue)]/45 shadow-[0_22px_60px_-38px_rgba(21,155,255,0.55)] lg:-translate-y-3 lg:hover:-translate-y-4 dark:border-[var(--brand-blue)]/45' : 'border-slate-200 dark:border-white/10 dark:hover:bg-white/[0.045]'}`}
                style={{ ['--package-accent' as string]: accent }}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </span>
                  {featured ? (
                    <span className="rounded-full border border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/[0.08] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--brand-blue)] dark:border-[var(--brand-blue)]/30 dark:bg-[var(--brand-blue)]/[0.1] dark:text-sky-400">{t.recommended}</span>
                  ) : (
                    <span className="font-display text-3xl font-semibold text-slate-100 dark:text-white/[0.06]">0{index + 1}</span>
                  )}
                </div>

                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.name}</p>
                <p className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-900 dark:text-white">{item.range}</p>
                <p className="mt-4 min-h-12 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{item.desc}</p>

                <div className="my-6 h-px bg-slate-100 dark:bg-white/[0.08]" />
                <ul className="space-y-3">
                  {item.items.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
                        <Check className="h-3 w-3" style={{ color: accent }} strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Link href={getRoutePath('contact', locale)} className={`inline-flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${featured ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100' : 'border border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/10 dark:text-slate-200 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950'}`}>
                    {t.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

      </div>
    </section>
  )
}
