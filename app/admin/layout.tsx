import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { fraunces, inter } from '@/lib/fonts'
import { siteViewport } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

// Third root layout: the private admin gets its own document without the public Header/Footer.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Nivello Admin', template: '%s | Nivello Admin' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: [{ url: '/nivello-icon.png', type: 'image/png', sizes: '256x256' }] }
}

export const viewport: Viewport = siteViewport

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} bg-stone-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
