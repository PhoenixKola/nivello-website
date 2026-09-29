import type { Metadata, Viewport } from 'next'
import SiteShell from '@/components/SiteShell'
import NotFound from '@/app/(en)/not-found'
import { rootMetadata, siteViewport } from '@/lib/seo'

export const metadata: Metadata = {
  ...rootMetadata('en'),
  title: { absolute: 'Page not found | Nivello' },
  robots: { index: false }
}
export const viewport: Viewport = siteViewport

export default function GlobalNotFound() {
  return (
    <SiteShell lang="en">
      <NotFound />
    </SiteShell>
  )
}
