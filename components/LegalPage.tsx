import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FileText, Mail, Scale, ShieldCheck } from 'lucide-react'
import { getRoutePath, type Locale } from '@/lib/site'

type LegalKind = 'privacy' | 'disclaimer' | 'imprint'

const copy = {
  en: {
    center: 'Legal centre',
    eyebrow: 'Nivello / Legal',
    current: 'Published page',
    document: 'Document',
    contactTitle: 'Questions?',
    contactBody: 'For privacy or legal enquiries, write to us directly.',
    contactCta: 'Email Nivello',
    labels: { privacy: 'Privacy', disclaimer: 'Disclaimer', imprint: 'Imprint' }
  },
  it: {
    center: 'Centro legale',
    eyebrow: 'Nivello / Legale',
    current: 'Pagina pubblicata',
    document: 'Documento',
    contactTitle: 'Domande?',
    contactBody: 'Per richieste sulla privacy o questioni legali, scrivici direttamente.',
    contactCta: 'Scrivi a Nivello',
    labels: { privacy: 'Privacy', disclaimer: 'Disclaimer', imprint: 'Impronta' }
  }
} satisfies Record<Locale, {
  center: string
  eyebrow: string
  current: string
  document: string
  contactTitle: string
  contactBody: string
  contactCta: string
  labels: Record<LegalKind, string>
}>

const documents: Array<{ kind: LegalKind; route: 'privacy' | 'disclaimer' | 'imprint'; icon: typeof ShieldCheck }> = [
  { kind: 'privacy', route: 'privacy', icon: ShieldCheck },
  { kind: 'disclaimer', route: 'disclaimer', icon: FileText },
  { kind: 'imprint', route: 'imprint', icon: Scale }
]

const documentNumbers: Record<LegalKind, string> = {
  privacy: '01',
  disclaimer: '02',
  imprint: '03'
}

export default function LegalPage({
  locale,
  kind,
  label,
  title,
  intro,
  children
}: {
  locale: Locale
  kind: LegalKind
  label: string
  title: string
  intro: string
  children: ReactNode
}) {
  const content = copy[locale]

  return (
    <main className="relative overflow-hidden bg-stone-50 dark:bg-slate-950/95">
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-blue)]/10 dark:bg-[var(--brand-gold)]/10">
              <Scale className="h-3 w-3 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{content.eyebrow}</span>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{label}</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">{title}</h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300/80">{intro}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl items-start gap-6 px-5 py-12 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8 lg:py-16">
          <aside className="space-y-5 lg:sticky lg:top-28">
            <nav aria-label={content.center} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{content.center}</p>
              {documents.map(document => {
                const active = document.kind === kind
                const Icon = document.icon
                return (
                  <Link
                    key={document.kind}
                    href={getRoutePath(document.route, locale)}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-[var(--brand-gold)]' : 'text-slate-400 group-hover:text-[var(--brand-blue)]'}`} />
                    {content.labels[document.kind]}
                    <span className={`ml-auto font-mono text-[9px] ${active ? 'text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>{documentNumbers[document.kind]}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
              <Mail className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
              <p className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">{content.contactTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{content.contactBody}</p>
              <a href="mailto:office@nivello.it" className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-[var(--brand-blue)] dark:text-white dark:hover:text-[var(--brand-gold)]">
                {content.contactCta}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </aside>

          <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{content.document}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{content.labels[kind]}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/[0.07] dark:text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                {content.current}
              </span>
            </header>

            <div className="legal-copy px-6 py-7 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:px-8 sm:py-9">
              {children}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
