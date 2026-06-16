'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import BottomCtaIt from '@/components/BottomCtaIt'

const serviceCards = [
  {
    accent: 'emerald',
    label: 'Strategia',
    title: 'Marketing e strategia',
    desc: 'Trasforma la visibilità in contatti concreti con offerte chiare e campagne ben strutturate.',
    items: ['Posizionamento e messaggi chiave', 'Landing page e pagine di vendita', 'Email flow e lead magnet', 'Configurazione analytics di base'],
    ideal: 'Ideale per lanci, nuovi prodotti e rebranding.'
  },
  {
    accent: 'sky',
    label: 'Design',
    title: 'Brand e design del prodotto',
    desc: 'Visual puliti e contemporanei, pensati per il mercato italiano ed europeo.',
    items: ['Identità visiva del brand', 'Design UI per siti e app', 'Design system e componenti', 'Materiali grafici e marketing'],
    ideal: 'Ideale per SaaS, agenzie e aziende di servizi.'
  },
  {
    accent: 'fuchsia',
    label: 'Sviluppo',
    title: 'Sviluppo e implementazione',
    desc: 'Siti veloci e ottimizzati per la SEO, costruiti con strumenti moderni.',
    items: ['Siti corporate e landing page', 'Frontend React e Next.js su misura', 'Integrazione CMS headless (su richiesta)', 'Focus su performance e accessibilità'],
    ideal: 'Ideale per chi cerca un partner tecnico di lungo periodo.'
  }
]

const accentMap: Record<string, { dot: string; badge: string; badgeBg: string; idealText: string }> = {
  emerald: { dot: 'bg-emerald-500 dark:bg-emerald-400', badge: 'text-emerald-700 dark:text-emerald-300', badgeBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30', idealText: 'text-emerald-600 dark:text-emerald-300' },
  sky: { dot: 'bg-sky-500 dark:bg-sky-400', badge: 'text-sky-700 dark:text-sky-300', badgeBg: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30', idealText: 'text-sky-600 dark:text-sky-300' },
  fuchsia: { dot: 'bg-fuchsia-500 dark:bg-fuchsia-400', badge: 'text-fuchsia-700 dark:text-fuchsia-300', badgeBg: 'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/30', idealText: 'text-fuchsia-600 dark:text-fuchsia-300' }
}

export default function ServicesPageIt() {
  return (
    <div className="bg-white dark:bg-ink">

      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-white/10 dark:bg-ink">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-emerald-400/8 blur-[120px] dark:bg-emerald-500/10" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/4 rounded-full bg-sky-400/6 blur-[100px] dark:bg-sky-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Servizi</span>
              </div>

              <h1 className="mb-5 font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
                Tutto ciò che la tua{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #059669 0%, #0284c7 55%, #c026d3 100%)' }}>
                  presenza digitale
                </span>{' '}
                richiede, dalla strategia al lancio.
              </h1>

              <p className="mb-7 max-w-[480px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
                Dalla prima impressione alla conversione finale — progettiamo e costruiamo l&apos;intero percorso digitale. Un unico studio, un unico team.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/it/contact" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
                  Inizia un progetto
                </Link>
                <Link href="/it/process" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                  Come lavoriamo →
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="grid grid-cols-2 gap-3">
              {[
                { accent: 'emerald', icon: '🎯', label: 'Strategia', desc: 'Posizionamento e messaggi' },
                { accent: 'sky', icon: '✏️', label: 'Design', desc: 'UI/UX e visual del brand' },
                { accent: 'fuchsia', icon: '⚡', label: 'Sviluppo', desc: 'React e Next.js' },
                { accent: 'amber', icon: '📈', label: 'Marketing', desc: 'Campagne e funnel' }
              ].map((s, i) => {
                const colors: Record<string, string> = { emerald: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5', sky: 'border-sky-200 bg-sky-50/60 dark:border-sky-500/20 dark:bg-sky-500/5', fuchsia: 'border-fuchsia-200 bg-fuchsia-50/60 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/5', amber: 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5' }
                const labelColors: Record<string, string> = { emerald: 'text-emerald-700 dark:text-emerald-300', sky: 'text-sky-700 dark:text-sky-300', fuchsia: 'text-fuchsia-700 dark:text-fuchsia-300', amber: 'text-amber-700 dark:text-amber-300' }
                return (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }} className={`rounded-2xl border p-4 ${colors[s.accent]}`}>
                    <div className="mb-3 text-2xl">{s.icon}</div>
                    <p className={`text-sm font-semibold ${labelColors[s.accent]}`}>{s.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-ink">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 md:grid-cols-3 md:py-28">
          {serviceCards.map((s, i) => {
            const c = accentMap[s.accent]
            return (
              <motion.div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${c.badge} ${c.badgeBg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  {s.label}
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{s.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${c.dot}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className={`mt-4 text-xs font-medium ${c.idealText}`}>{s.ideal}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <BottomCtaIt />
    </div>
  )
}
