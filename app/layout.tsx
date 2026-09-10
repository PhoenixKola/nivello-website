import './globals.css'
import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import StructuredData from '@/components/StructuredData'
import { getRoutePath } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  display: 'swap'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nivello.it'),
  title: 'Nivello',
  description:
    'A development-led digital studio building modern websites and custom web apps, supported by strategy and design.',
  icons: {
    icon: [
      { url: '/nivello-icon.png', type: 'image/png', sizes: '256x256' },
      { url: '/favicon.ico', sizes: '64x64' }
    ],
    shortcut: '/favicon.ico',
    apple: '/nivello-icon.png'
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Nivello',
    description:
      'Nivello builds modern websites and web apps, with strategy, marketing, and design supporting the development.',
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
      'Modern Next.js development for ambitious brands, supported by strategy, marketing, and design.',
    images: ['/og/home']
  },
  alternates: {
    canonical: getRoutePath('home', 'en'),
    languages: {
      en: getRoutePath('home', 'en'),
      it: getRoutePath('home', 'it')
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#020618'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
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
