import HomeFooter from '@/components/home-cinematic/HomeFooter'
import HomeBuildPipeline from '@/components/HomeBuildPipeline'
import HomeHero from '@/components/HomeHero'
import HomeProjectStage from '@/components/HomeProjectStage'
import ProofSection from '@/components/ProofSection'
import ProjectLauncher from '@/components/ProjectLauncher'
import CinematicWorld from '@/components/home-cinematic/CinematicWorld'
import HomeImmersiveChrome from '@/components/home-cinematic/HomeImmersiveChrome'
import { CHAPTER_IDS, CHAPTER_LENGTHS } from '@/lib/cinematic/chapters'
import type { Locale } from '@/lib/site'

// Without JavaScript the story still reads top to bottom, and the normal navigation stays visible.
const noScript = `
  html:has(.cin) [data-site-header]{position:sticky!important;transform:none!important;visibility:visible!important}
  .cin .cin-pin{position:relative!important;height:auto!important;overflow:visible!important}
  .cin .cin-spacers,.cin .cin-canvas{display:none!important}
  .cin .cin-foot>*{opacity:1!important;transform:none!important}
  .cin .cin-ov{position:relative!important;opacity:1!important;visibility:visible!important;transform:none!important}
`

/**
 * Immersive homepage: one persistent WebGL world (the sticky stage) driven by the document scroll, with five
 * chapters of HTML overlays on top. The spacers below the stage only provide scroll length; every chapter's
 * content lives in the DOM for crawlers, keyboards and the non-WebGL fallback.
 */
export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <main id="main-content" tabIndex={-1} className="cin flex-1 outline-none" data-cin-root data-mode="pending">
      <noscript><style>{noScript}</style></noscript>
      <HomeImmersiveChrome locale={locale} />
      <div className="cin-scroll">
        <div className="cin-pin">
          <CinematicWorld locale={locale} />
          <div className="cin-overlays">
            <HomeHero locale={locale} />
            <HomeBuildPipeline locale={locale} />
            <HomeProjectStage locale={locale} />
            <ProofSection locale={locale} />
            <ProjectLauncher locale={locale} />
            <HomeFooter locale={locale} />
          </div>
        </div>
        <div className="cin-spacers" data-cin-spacers aria-hidden="true">
          {CHAPTER_IDS.map((id, index) => (
            <div
              key={id}
              className="cin-spacer"
              data-chapter={id}
              style={{ height: `${(CHAPTER_LENGTHS[index] + (index === CHAPTER_IDS.length - 1 ? 1 : 0)) * 100}svh` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
