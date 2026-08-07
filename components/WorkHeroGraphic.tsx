import Image from 'next/image'
import { ArrowUpRight, LayoutDashboard, MonitorUp } from 'lucide-react'
import type { Locale } from '@/lib/site'

const copy = {
  en: { website: 'Public experience', app: 'Private workspace', websiteType: 'Website', appType: 'Web app' },
  it: { website: 'Esperienza pubblica', app: 'Spazio privato', websiteType: 'Sito web', appType: 'Web app' }
} satisfies Record<Locale, Record<string, string>>

export default function WorkHeroGraphic({ locale }: { locale: Locale }) {
  const t = copy[locale]

  return (
    <div className="relative mx-auto min-h-[390px] w-full max-w-[560px] sm:min-h-[440px] lg:mx-0 lg:ml-auto" aria-hidden="true">
      <div className="absolute left-0 top-4 w-[82%] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_28px_70px_-32px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MonitorUp className="h-3.5 w-3.5 text-[var(--brand-blue)]" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{t.website}</span>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
          <Image src="/work-progreen-live.png" alt="" fill sizes="(max-width: 1024px) 82vw, 460px" className="object-cover object-top" priority />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-4 pb-4 pt-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#b9e5bf]">ProGreen</p>
            <p className="mt-1 text-sm font-semibold text-white">{t.websiteType}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-0 w-[76%] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{t.app}</span>
          </div>
          <span className="border-l border-slate-200 pl-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:border-white/10 dark:text-slate-500">{t.appType}</span>
        </div>
        <div className="relative aspect-[16/8] overflow-hidden rounded-xl border border-slate-100 bg-[#f6f7ef] dark:border-white/10">
          <Image src="/work-progreen-app-redacted.png" alt="" fill sizes="(max-width: 1024px) 76vw, 420px" className="object-cover object-top" priority />
        </div>
      </div>

      <div className="absolute right-[13%] top-[7%] h-16 w-px bg-gradient-to-b from-[var(--brand-blue)] to-transparent" />
      <div className="absolute bottom-[8%] left-[8%] h-px w-20 bg-gradient-to-r from-transparent to-[var(--brand-gold)]" />
    </div>
  )
}
