import './globals.css'
import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  display: 'swap'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://nivello.it'),
  title: {
    default: 'Nivello',
    template: '%s · Nivello'
  },
  description:
    'Italian digital studio helping brands with marketing, design, and custom software development.',
  openGraph: {
    title: 'Nivello — Premium websites for ambitious Italian brands',
    description:
      'Nivello blends strategy, aesthetics, and technology to build marketing websites, product pages and custom software for Italian and European brands.',
    url: '/',
    siteName: 'Nivello',
    type: 'website',
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nivello — Premium websites for ambitious Italian brands',
    description:
      'Strategy, design, and Next.js development for brands that want to look sharper, communicate clearly, and convert better.'
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
      <body suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} bg-white text-slate-900 antialiased dark:bg-ink dark:text-slate-50`}>
        <ThemeProvider>
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
