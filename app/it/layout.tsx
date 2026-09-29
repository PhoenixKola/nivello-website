import type { Metadata, Viewport } from 'next'
import SiteShell from '@/components/SiteShell'
import { rootMetadata, siteViewport } from '@/lib/seo'

export const metadata: Metadata = rootMetadata('it')
export const viewport: Viewport = siteViewport

export default function ItalianRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="it">{children}</SiteShell>
}
