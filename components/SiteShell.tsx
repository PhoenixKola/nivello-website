import '@/app/globals.css'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import StructuredData from '@/components/StructuredData'
import { fraunces, inter } from '@/lib/fonts'
import type { Locale } from '@/lib/site'


const skipLabel: Record<Locale, string> = {
  en: 'Skip to content',
  it: 'Vai al contenuto'
}

// Shared document shell for both root layouts, so each locale can emit its own <html lang>.
export default function SiteShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${fraunces.variable} bg-stone-50 text-slate-900 antialiased dark:bg-slate-950/95 dark:text-slate-50`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-slate-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[var(--brand-blue)] dark:focus:bg-white dark:focus:text-slate-950 dark:focus:outline-[var(--brand-gold)]"
        >
          {skipLabel[lang]}
        </a>
        <ThemeProvider>
          <StructuredData />
          <AnalyticsTracker />
          <div className="flex min-h-screen flex-col">
            <Header />
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
