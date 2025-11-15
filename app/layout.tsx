import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nivello',
  description:
    'Italian digital studio helping brands with marketing, design, and custom software development.'
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
          <main className="flex-1 bg-slate-950">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}