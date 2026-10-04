import ClientLogoMarquee from '@/components/ClientLogoMarquee'
import HomeBuildPipeline from '@/components/HomeBuildPipeline'
import HomeHero from '@/components/HomeHero'
import HomeProjectStage from '@/components/HomeProjectStage'
import ProofSection from '@/components/ProofSection'
import ProjectLauncher from '@/components/ProjectLauncher'
import type { Locale } from '@/lib/site'

// Server-rendered homepage shell; interactive sections remain isolated client islands.
export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-stone-50 outline-none dark:bg-slate-950/95">
      <div className="bg-stone-50 dark:bg-slate-950/95">
        <HomeHero locale={locale} />
        <section className="relative -mt-14 overflow-hidden pb-3 pt-2 min-[901px]:-mt-36">
          <ClientLogoMarquee locale={locale} />
        </section>
      </div>

      <HomeBuildPipeline locale={locale} />
      <HomeProjectStage locale={locale} />
      <ProofSection locale={locale} />
      <ProjectLauncher locale={locale} />
    </main>
  )
}
