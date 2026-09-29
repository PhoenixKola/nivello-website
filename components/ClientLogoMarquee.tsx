import Image from 'next/image'
import Link from 'next/link'
import { getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'

const logos: Record<string, { src: string; width: number; height: number; contrast?: 'dark-logo' | 'light-logo'; className?: string }> = {
  'rombo-nord': { src: '/client-logos/rombo-nord.webp', width: 400, height: 400, className: 'max-h-[88px] max-w-[166px] sm:max-h-[98px] sm:max-w-[190px]' },
  'le-camelie': { src: '/client-logos/le-camelie.webp', width: 228, height: 237, className: 'max-h-[88px] max-w-[166px] sm:max-h-[98px] sm:max-w-[190px]' },
  'gjergj-jozef-kola': { src: '/client-logos/gjergj-jozef-kola.png', width: 305, height: 57, contrast: 'dark-logo' },
  consteam: { src: '/client-logos/consteam.webp', width: 400, height: 190, contrast: 'light-logo' },
  'your-assist-in-italy': { src: '/client-logos/your-assist-in-italy.svg', width: 130, height: 49, className: 'max-h-[84px] max-w-[170px] sm:max-h-[92px] sm:max-w-[196px]' },
  progreen: { src: '/client-logos/progreen.webp', width: 400, height: 151 }
}

const copy = {
  en: { heading: 'Trusted by', view: 'View project' },
  it: { heading: 'Hanno scelto Nivello', view: 'Vedi progetto' }
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
        className="group relative flex h-[92px] w-[180px] shrink-0 items-center justify-center px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)] sm:h-[104px] sm:w-[208px] xl:w-[238px] dark:focus-visible:outline-[var(--brand-gold)]"
      >
        <Image
          src={logo.src}
          alt=""
          width={logo.width}
          height={logo.height}
          sizes="(max-width: 640px) 150px, 180px"
          className={`h-auto w-auto max-h-[76px] max-w-[150px] object-contain opacity-75 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 group-focus-visible:scale-105 group-focus-visible:opacity-100 sm:max-h-[84px] sm:max-w-[174px] ${logo.contrast === 'dark-logo' ? 'dark:invert' : ''} ${logo.contrast === 'light-logo' ? 'invert dark:invert-0' : ''} ${logo.className || ''}`}
        />
        <span role="tooltip" className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950">
          {project.title}
        </span>
      </Link>
    )
  })

  return (
    <div className="relative z-20 w-full pb-8 lg:-mt-2 lg:pb-10 xl:-mt-4">
      <div className="mb-1 flex items-center gap-4 px-4 sm:px-6 lg:px-10">
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.heading}</p>
        <span className="h-px flex-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent dark:from-white/20 dark:via-white/10" aria-hidden="true" />
      </div>
      <div className="client-logo-marquee overflow-hidden" aria-label={t.heading}>
        <div className="client-logo-track flex w-max">
          <div className="flex min-w-[100vw] shrink-0 items-center justify-around gap-5 px-2">{logoLinks(false)}</div>
          <div className="flex min-w-[100vw] shrink-0 items-center justify-around gap-5 px-2" aria-hidden="true">{logoLinks(true)}</div>
        </div>
      </div>
    </div>
  )
}
