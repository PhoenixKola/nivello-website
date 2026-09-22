import Image from 'next/image'
import Link from 'next/link'
import { getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'

const logos: Record<string, { src: string; width: number; height: number; dark?: boolean }> = {
  'rombo-nord': { src: '/client-logos/rombo-nord.png', width: 512, height: 512 },
  'le-camelie': { src: '/client-logos/le-camelie.png', width: 228, height: 237 },
  'gjergj-jozef-kola': { src: '/client-logos/gjergj-jozef-kola.png', width: 305, height: 57 },
  consteam: { src: '/client-logos/consteam.png', width: 3172, height: 1509, dark: true },
  'your-assist-in-italy': { src: '/client-logos/your-assist-in-italy.svg', width: 130, height: 49 },
  progreen: { src: '/client-logos/progreen.png', width: 2000, height: 755, dark: true }
}

const copy = {
  en: { heading: 'Our clients', view: 'View project' },
  it: { heading: 'I nostri clienti', view: 'Vedi progetto' }
}

export default function ClientLogoMarquee({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const projects = getProjects(locale).filter(project => logos[project.slug])

  const logoLinks = (duplicate: boolean) => projects.map(project => {
    const logo = logos[project.slug]

    return (
      <Link
        key={project.slug}
        href={getProjectPath(project.slug, locale)}
        aria-label={`${t.view}: ${project.title}`}
        tabIndex={duplicate ? -1 : undefined}
        className={`group relative flex h-[76px] w-[150px] shrink-0 items-center justify-center rounded-2xl border px-5 transition-colors duration-200 hover:border-[var(--brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] sm:h-[82px] sm:w-[168px] xl:w-[204px] dark:hover:border-[var(--brand-gold)] dark:focus-visible:outline-[var(--brand-gold)] ${logo.dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
      >
        <Image
          src={logo.src}
          alt=""
          width={logo.width}
          height={logo.height}
          sizes="168px"
          className="h-auto w-auto max-h-[62px] max-w-[128px] object-contain"
        />
        <span role="tooltip" className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-1 rounded-md bg-slate-950/95 px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {project.title}
        </span>
      </Link>
    )
  })

  return (
    <div className="relative z-20 w-full pb-8 lg:-mt-12 lg:pb-10 xl:-mt-16">
      <div className="mb-4 flex items-center gap-4 px-4 sm:px-6 lg:px-10">
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.heading}</p>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
      </div>
      <div className="client-logo-marquee overflow-hidden" aria-label={t.heading}>
        <div className="client-logo-track flex w-max">
          <div className="flex min-w-[100vw] shrink-0 items-center justify-around gap-4 px-2">{logoLinks(false)}</div>
          <div className="flex min-w-[100vw] shrink-0 items-center justify-around gap-4 px-2" aria-hidden="true">{logoLinks(true)}</div>
        </div>
      </div>
    </div>
  )
}
