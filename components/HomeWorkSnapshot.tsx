import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Globe2, LayoutDashboard } from 'lucide-react'
import { getProjectPath, getProjects } from '@/lib/projects'
import { getRoutePath } from '@/lib/site'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Featured work',
    title: 'A snapshot of what we build.',
    intro: 'From the website a customer first sees to the tools a team uses every day.',
    websitesLabel: 'Public-facing experiences',
    websitesTitle: 'Websites & landing pages',
    websitesDescription: 'Clear, fast, maintainable places for brands to tell their story and turn interest into action.',
    websitesProject: 'Featured website',
    websitesAction: 'Explore websites',
    appsLabel: 'Behind-the-scenes products',
    appsTitle: 'Apps & digital tools',
    appsDescription: 'Purpose-built workspaces that bring people, projects, and next steps together.',
    appsProject: 'Featured web app',
    appsAction: 'Explore apps',
    caseStudy: 'View case study',
    allWork: 'See all work',
    websiteAlt: 'Rombo Nord restaurant website preview',
    secondWebsiteAlt: 'Le Camelie guesthouse website preview',
    appAlt: 'Anonymized preview of the ProGreen site-management app'
  },
  it: {
    eyebrow: 'Lavori selezionati',
    title: 'Una panoramica di ciò che costruiamo.',
    intro: 'Dal sito che un cliente vede per primo agli strumenti che un team usa ogni giorno.',
    websitesLabel: 'Esperienze pubbliche',
    websitesTitle: 'Siti & landing page',
    websitesDescription: 'Spazi chiari, veloci e mantenibili per raccontare un brand e trasformare l’interesse in azione.',
    websitesProject: 'Sito in evidenza',
    websitesAction: 'Esplora i siti',
    appsLabel: 'Prodotti dietro le quinte',
    appsTitle: 'App & strumenti digitali',
    appsDescription: 'Spazi di lavoro su misura che riuniscono persone, progetti e prossime attività.',
    appsProject: 'App web in evidenza',
    appsAction: 'Esplora le app',
    caseStudy: 'Vedi il case study',
    allWork: 'Vedi tutti i lavori',
    websiteAlt: 'Anteprima del sito del ristorante Rombo Nord',
    secondWebsiteAlt: 'Anteprima del sito della guesthouse Le Camelie',
    appAlt: 'Anteprima anonimizzata del gestionale cantieri ProGreen'
  }
} satisfies Record<Locale, Record<string, string>>

export default function HomeWorkSnapshot({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const projects = getProjects(locale)
  const websites = projects.filter(project => project.kinds.includes('website'))
  const apps = projects.filter(project => project.kinds.includes('app') && project.app)
  const firstWebsite = websites[0]
  const secondWebsite = websites[1]
  const featuredApp = apps[0]
  const workPath = getRoutePath('work', locale)

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95" aria-labelledby="home-work-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.eyebrow}</p>
            <h2 id="home-work-heading" className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">{t.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.intro}</p>
          </div>
          <Link href={workPath} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:text-blue-600 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300">
            {t.allWork}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(15,23,42,0.5)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
            <div className="flex-1 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[var(--brand-blue)] dark:bg-[var(--brand-blue)]/10"><Globe2 className="h-5 w-5" /></span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:text-slate-400">{String(websites.length).padStart(2, '0')} {locale === 'it' ? 'progetti' : 'projects'}</span>
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{t.websitesLabel}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{t.websitesTitle}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-300/80">{t.websitesDescription}</p>
            </div>
            <div className="relative mx-4 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e9f4fc,#f7f4e8)] px-5 pb-5 pt-8 sm:mx-5 sm:px-8 dark:bg-[linear-gradient(135deg,#12263b,#22251f)]">
              <div className="relative mx-auto max-w-[400px]">
                <Link href={getProjectPath(firstWebsite.slug, locale)} aria-label={`${t.caseStudy}: ${firstWebsite.title}`} className="group/image block overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_24px_45px_-20px_rgba(15,23,42,0.5)] ring-1 ring-slate-900/5 dark:border-white/15">
                  <div className="relative aspect-[16/10]"><Image src={firstWebsite.shot} alt={t.websiteAlt} fill sizes="(max-width: 1024px) 75vw, 400px" className="object-cover object-top transition-transform duration-500 group-hover/image:scale-[1.03]" /></div>
                </Link>
                <div className="absolute -bottom-3 -right-2 w-[36%] overflow-hidden rounded-lg border-2 border-white bg-white shadow-[0_18px_35px_-14px_rgba(15,23,42,0.5)] sm:-right-4 dark:border-slate-800">
                  <div className="relative aspect-[4/3]"><Image src={secondWebsite.shot} alt={t.secondWebsiteAlt} fill sizes="(max-width: 1024px) 27vw, 145px" className="object-cover object-top" /></div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 sm:px-8">
              <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-800 dark:text-slate-200">{t.websitesProject}:</span> {firstWebsite.title}</p>
              <Link href={`${workPath}#websites`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:text-blue-600 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300">{t.websitesAction}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </article>

          <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#205447] bg-[#102c2b] text-white shadow-[0_24px_65px_-45px_rgba(15,23,42,0.6)] transition-transform duration-300 hover:-translate-y-1 dark:border-[#356656] dark:shadow-none">
            <div className="flex-1 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#90c898]/15 text-[#a8dfae]"><LayoutDashboard className="h-5 w-5" /></span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">{String(apps.length).padStart(2, '0')} {locale === 'it' ? 'progetto' : 'project'}</span>
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8dfae]">{t.appsLabel}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t.appsTitle}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200/75 sm:text-base">{t.appsDescription}</p>
            </div>
            <div className="relative mx-4 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#467460_0%,#204940_48%,#163d38_100%)] px-5 pb-5 pt-8 sm:mx-5 sm:px-8">
              <div className="mx-auto max-w-[400px] overflow-hidden rounded-xl border border-white/20 bg-[#f6f7ef] shadow-[0_24px_45px_-20px_rgba(0,0,0,0.65)]">
                <Link href={getProjectPath(featuredApp.slug, locale)} aria-label={`${t.caseStudy}: ${featuredApp.title}`} className="group/image block">
                  <div className="relative aspect-[16/10]"><Image src={featuredApp.appShot || featuredApp.shot} alt={t.appAlt} fill sizes="(max-width: 1024px) 75vw, 400px" className="object-cover object-top transition-transform duration-500 group-hover/image:scale-[1.03]" /></div>
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 sm:px-8">
              <p className="text-xs text-white/65"><span className="font-semibold text-white">{t.appsProject}:</span> {featuredApp.title}</p>
              <Link href={`${workPath}#apps`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8dfae] transition-colors hover:text-white">{t.appsAction}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
