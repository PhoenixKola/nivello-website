import { Globe2, PanelsTopLeft } from 'lucide-react'
import type { ProjectKind } from '@/lib/projects'
import type { Locale } from '@/lib/site'

const labels = {
  en: { website: 'Website / landing page', app: 'Web app' },
  it: { website: 'Sito / landing page', app: 'Web app' }
} satisfies Record<Locale, Record<ProjectKind, string>>

const icons = { website: Globe2, app: PanelsTopLeft }

export default function ProjectTypeBadges({
  kinds,
  locale,
  className = ''
}: {
  kinds: ProjectKind[]
  locale: Locale
  className?: string
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {kinds.map(kind => {
        const Icon = icons[kind]
        return (
          <span
            key={kind}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
          >
            <Icon className="h-3 w-3 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
            {labels[locale][kind]}
          </span>
        )
      })}
    </div>
  )
}
