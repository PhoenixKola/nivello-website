import './globals.css'
import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import StructuredData from '@/components/StructuredData'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  display: 'swap'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nivello.it'),
  title: {
    default: 'Nivello',
    template: '%s | Nivello'
  },
  description:
    'Italy-based digital studio helping brands with strategy, marketing, design, and custom software development.',
  icons: {
    icon: '/favicon.ico'
    // TODO: Add /apple-touch-icon.png when a production touch icon is available.
  },
  openGraph: {
    title: 'Nivello',
    description:
      'Nivello blends strategy, marketing, design, and technology for Italian and European brands.',
    url: '/',
    siteName: 'Nivello',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/og/home', width: 1200, height: 630, alt: 'Nivello' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nivello',
    description:
      'Strategy, marketing, design, and Next.js development for brands that want to look sharper and convert better.',
    images: ['/og/home']
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      it: '/it'
    }
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} bg-stone-50 text-slate-900 antialiased dark:bg-slate-950/95 dark:text-slate-50`}>
        <ThemeProvider>
          <StructuredData />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
