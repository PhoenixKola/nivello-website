import type { Metadata, Viewport } from 'next'
import SiteShell from '@/components/SiteShell'
import { rootMetadata, siteViewport } from '@/lib/seo'

export const metadata: Metadata = rootMetadata('en')
export const viewport: Viewport = siteViewport

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>
}
