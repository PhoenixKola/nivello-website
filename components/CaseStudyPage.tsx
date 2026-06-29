import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import BottomCta from '@/components/BottomCta'
import type { Locale } from '@/lib/site'
import { getRoutePath } from '@/lib/site'
import { getProject } from '@/lib/projects'

export default function CaseStudyPage({ slug, locale = 'en' }: { slug: string; locale?: Locale }) {
  const project = getProject(slug, locale)
  if (!project) return null
  const isItalian = locale === 'it'

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
          <div>
            <Link href={getRoutePath('work', locale)} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {isItalian ? 'Lavori' : 'Our Work'}
            </Link>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{project.category}</p>
            <h1 className="mt-3 font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              {project.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{project.desc}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.services.map(service => (
                <span key={service} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  {service}
                </span>
              ))}
            </div>
            <a href={project.href} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              {isItalian ? 'Visita il sito live' : 'Visit live site'}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <Image src={project.shot} alt={`${project.title} website`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-top" priority />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: isItalian ? 'Sfida' : 'Challenge', body: project.challenge },
              { title: isItalian ? 'Soluzione' : 'Solution', body: project.solution },
              { title: isItalian ? 'Risultato' : 'Result', body: project.result }
            ].map(item => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: project.color }} />
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href={getRoutePath('contact', locale)} className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-blue)] shadow-sm transition hover:border-[var(--brand-blue)]/40 hover:shadow dark:border-white/10 dark:bg-white/[0.03] dark:text-[var(--brand-gold)] dark:hover:border-[var(--brand-gold)]/40">
              {isItalian ? 'Vuoi un risultato simile?' : 'Want a similar result?'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <BottomCta locale={locale} />
    </main>
  )
}
