import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://nivello.it'),
  title: {
    default: 'Nivello',
    template: '%s · Nivello'
  },
  description:
    'Italian digital studio helping brands with marketing, design, and custom software development.',
  openGraph: {
    title: 'Nivello',
    description:
      'Nivello blends strategy, aesthetics, and technology to build marketing websites, product pages and custom software for Italian and European brands.',
    url: '/',
    siteName: 'Nivello',
    type: 'website',
    locale: 'en_US'
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
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-slate-950">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}