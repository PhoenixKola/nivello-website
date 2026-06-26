import Link from 'next/link'
import { ArrowRight, CheckCircle2, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import BottomCta from '@/components/BottomCta'
import type { Locale } from '@/lib/site'
import { getRoutePath } from '@/lib/site'
import type { ServiceSlug } from '@/lib/services'
import { getService } from '@/lib/services'

const icons = {
  compass: Compass,
  megaphone: Megaphone,
  palette: Palette,
  code: Code2
}

export default function ServiceDetailPage({ slug, locale = 'en' }: { slug: ServiceSlug; locale?: Locale }) {
  const service = getService(slug, locale)
  if (!service) return null
  const Icon = icons[service.icon]
  const isItalian = locale === 'it'

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_0.42fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <Link href={getRoutePath('services', locale)} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {isItalian ? 'Servizi' : 'Services'}
            </Link>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              {service.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              {service.intro}
            </p>
            <Link href={getRoutePath('contact', locale)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              {isItalian ? 'Parliamo del progetto' : 'Discuss the project'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
              <Icon className="h-6 w-6" style={{ color: service.color }} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{service.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{service.desc}</p>
          </div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 md:grid-cols-3 md:py-28">
          {[
            { title: isItalian ? 'Deliverable' : 'Deliverables', items: service.deliverables },
            { title: isItalian ? 'Risultati' : 'Outcomes', items: service.outcomes },
            { title: isItalian ? 'Metodo' : 'Process', items: service.process }
          ].map(group => (
            <article key={group.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{group.title}</h2>
              <ul className="mt-5 space-y-3">
                {group.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: service.color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <BottomCta locale={locale} />
    </main>
  )
}
