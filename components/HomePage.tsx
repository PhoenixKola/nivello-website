import Link from 'next/link'
import { ArrowRight, CheckCircle2, Code2, Globe2, Languages } from 'lucide-react'
import AnimatedHeroGraphic from '@/components/AnimatedHeroGraphic'
import ClientLogoMarquee from '@/components/ClientLogoMarquee'
import HomeBuildPipeline from '@/components/HomeBuildPipeline'
import HomeProjectStage from '@/components/HomeProjectStage'
import ProofSection from '@/components/ProofSection'
import ProjectLauncher from '@/components/ProjectLauncher'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    badge: 'Working across Europe',
    titleStart: 'Modern web development for',
    titleAccent: 'ambitious brands.',
    intro: 'We build fast, maintainable websites and web apps with React and Next.js, with strategy, design, and marketing support where the product needs it.',
    primary: 'View our work',
    secondary: 'Book a call',
    points: ['Italian & English', 'Development to launch', 'React / Next.js', 'EU-friendly']
  },
  it: {
    badge: 'Attivi in Europa',
    titleStart: 'Sviluppo web moderno per brand',
    titleAccent: 'ambiziosi.',
    intro: 'Sviluppiamo siti e applicazioni web veloci e facili da mantenere con React e Next.js, con strategia, design e marketing a supporto del prodotto quando servono.',
    primary: 'Guarda i lavori',
    secondary: 'Prenota una call',
    points: ['Italiano e inglese', 'Dallo sviluppo al lancio', 'React / Next.js', 'Mercato europeo']
  }
} satisfies Record<Locale, { badge: string; titleStart: string; titleAccent: string; intro: string; primary: string; secondary: string; points: string[] }>

const pointIcons = [Languages, CheckCircle2, Code2, Globe2]

// Server-rendered homepage shell; only the interactive sections below are client islands.
export default function HomePage({ locale }: { locale: Locale }) {
  const t = copy[locale]

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-stone-50 outline-none dark:bg-slate-950/95">
      <section className="relative overflow-hidden bg-stone-50 dark:bg-slate-950/95">
        <div className="relative z-10 mx-auto grid min-h-[60vh] max-w-7xl items-center gap-10 px-6 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:pb-0 lg:pt-12">
          <div className="nv-rise text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">{t.badge}</span>
            </div>

            <h1 className="text-[2.7rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] dark:text-white">
              {t.titleStart}{' '}
              <span className="italic text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.titleAccent}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0 dark:text-slate-300/75">{t.intro}</p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href={getRoutePath('work', locale)}
                data-track-cta="hero_view_work"
                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 dark:border-white/20 dark:bg-transparent dark:text-white dark:shadow-none dark:hover:border-[var(--brand-gold)]/55 dark:hover:bg-white/[0.06]"
              >
                {t.primary}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href={getRoutePath('contact', locale)}
                data-track-cta="hero_book_call"
                className="rounded-full border border-slate-300 bg-white/85 px-8 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)] dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[var(--brand-gold)]/60"
              >
                {t.secondary}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
              {t.points.map((label, index) => {
                const Icon = pointIcons[index]
                return (
                  <li key={label} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Icon aria-hidden="true" className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                    <span>{label}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <AnimatedHeroGraphic />
          </div>
        </div>
        <ClientLogoMarquee locale={locale} />
      </section>

      <HomeBuildPipeline locale={locale} />
      <HomeProjectStage locale={locale} />
      <ProofSection locale={locale} />
      <ProjectLauncher locale={locale} />
    </main>
  )
}
