'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import BottomCta from '@/components/BottomCta'

const projects = [
  {
    href: 'https://rombonord.com/it/',
    category: 'Hospitality · Restaurant & Cocktail Bar',
    title: 'Rombo Nord · Genova Pegli',
    desc: 'Bilingual website for a historic seaside restaurant and cocktail bar in Pegli, with clear paths to menus, events, and reservations.',
    details: ['Separate drink and restaurant menus', 'Online booking flow linked to the contact channel', 'Atmospheric visuals aligned with the brand'],
    accent: 'emerald',
    linkText: 'Visit site ↗'
  },
  {
    href: 'https://le-camelie.com/',
    category: 'Hospitality · Guesthouse Website',
    title: 'Le Camelie · Rooms in Genova',
    desc: 'Compact property site for a guesthouse in the centre of Genova, focused on clarity, comfort details, and booking-engine conversions.',
    details: ['Room galleries and amenities overview', 'Trust-focused layout with review highlights', 'Clear call-to-action to booking engine'],
    accent: 'sky',
    linkText: 'Visit site ↗'
  },
  {
    href: 'https://gjergj-jozef-kola.com/',
    category: 'Publishing · Author Portfolio',
    title: 'Gjergj Jozef Kola · Author site',
    desc: 'Multilingual author website with a small shop, presenting books, biography, and contact in a calm, literary layout.',
    details: ['Author intro and featured books', 'Book pages ready for e-commerce', 'Contact for readers and media'],
    accent: 'fuchsia',
    linkText: 'Visit site ↗'
  },
  {
    href: 'https://consteam.eu/',
    category: 'Local Business · Home Services',
    title: 'Consteam · Professional Cleaning & Maintenance',
    desc: 'Responsive multi-page site for a cleaning & maintenance company, emphasizing services, contact flows and trust signals for clients.',
    details: ['Service overview with clear sections per offer', 'Contact form and easy-to-access request flow', 'Clean, professional layout suited for B2B / B2C conversions'],
    accent: 'emerald',
    linkText: 'Visit site ↗'
  },
  {
    href: 'https://yourassistinitaly.it/',
    category: 'Expat Services · Immigration Consulting',
    title: 'Your Assist in Italy · Florence',
    desc: 'Bilingual site for an immigration consultancy based in Florence, helping expats navigate residence permits, VAT numbers, and work authorizations with confidence.',
    details: ['Bilingual English/Italian service pages', 'Clear pricing tiers and consultation booking', 'Trust-building layout with FAQs and testimonials'],
    accent: 'sky',
    linkText: 'Visit site ↗'
  }
]

const accentStyles: Record<string, { hover: string; text: string; dot: string }> = {
  emerald: { hover: 'hover:border-emerald-300 hover:shadow-emerald-500/10 dark:hover:border-emerald-500/40 dark:hover:shadow-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
  sky: { hover: 'hover:border-sky-300 hover:shadow-sky-500/10 dark:hover:border-sky-500/40 dark:hover:shadow-sky-500/20', text: 'text-sky-600 dark:text-sky-300', dot: 'bg-sky-500' },
  fuchsia: { hover: 'hover:border-fuchsia-300 hover:shadow-fuchsia-500/10 dark:hover:border-fuchsia-500/40 dark:hover:shadow-fuchsia-500/20', text: 'text-fuchsia-600 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' }
}

export default function WorkPage() {
  return (
    <div className="bg-white dark:bg-slate-950">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-sky-400/8 blur-[130px] dark:bg-sky-500/10" />
          <div className="absolute left-1/4 bottom-0 h-[400px] w-[400px] translate-y-1/4 rounded-full bg-fuchsia-400/6 blur-[100px] dark:bg-fuchsia-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-20 md:py-28">

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mb-12"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Our work</span>
              </div>

              <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3rem] dark:text-slate-50">
                Selected work built to{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 55%, #db2777 100%)' }}
                >
                  look sharp
                </span>{' '}
                and perform clearly.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
                Real projects across hospitality, publishing, local business, and expat services. Every site designed and built by Nivello, from strategy to final launch.
              </p>
            </motion.div>

            {/* Project preview strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {projects.map((p, i) => {
                const s = accentStyles[p.accent]
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className={`mb-1.5 h-1.5 w-8 rounded-full ${s.dot}`} />
                    <p className="text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-200">{p.title.split('·')[0].trim()}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{p.category.split('·')[0].trim()}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Project cards ────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3 md:py-16">
          {projects.map((p, i) => {
            const s = accentStyles[p.accent]
            return (
              <motion.div key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950/90 ${s.hover}`}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.category}</p>
                    <h2 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.title}</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{p.desc}</p>
                    <ul className="mt-3 space-y-1">
                      {p.details.map(d => (
                        <li key={d} className="flex items-start gap-1.5 text-xs text-slate-400 dark:text-slate-400">
                          <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${s.dot} opacity-60`} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className={`mt-4 text-xs font-medium ${s.text}`}>{p.linkText}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <BottomCta />
    </div>
  )
}
