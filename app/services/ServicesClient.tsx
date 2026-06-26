'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Code2, Compass, Megaphone, Palette } from 'lucide-react'
import PricingSection from '@/components/PricingSection'
import { getServicePath, getServices } from '@/lib/services'

const icons = {
  compass: Compass,
  megaphone: Megaphone,
  palette: Palette,
  code: Code2
}

export default function ServicesClient() {
  const serviceCards = getServices('en')

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="relative overflow-hidden bg-stone-50 dark:bg-slate-950/95">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_0.48fr] lg:items-center lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Services</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Everything your digital presence needs, from <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">strategy to launch.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              From first impression to final conversion, we design and build the full digital journey. One studio, one team, no handover friction.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Studio stack</p>
            <div className="mt-5 space-y-3">
              {serviceCards.map(service => (
                <div key={service.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-950/50">
                  {(() => {
                    const Icon = icons[service.icon]
                    return <Icon className="h-4 w-4" style={{ color: service.color }} />
                  })()}
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{service.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">What we do</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Four connected services, one clean workflow.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {serviceCards.map((s, i) => (
              <motion.article
                key={s.title}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {(() => {
                  const Icon = icons[s.icon]
                  return (
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                      <Icon className="h-5 w-5" style={{ color: s.color }} />
                    </div>
                  )
                })()}
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{s.shortTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{s.desc}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.ideal}</p>
                  <Link href={getServicePath(s.slug, 'en')} className="mt-3 inline-flex text-xs font-semibold text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
                    View service
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <PricingSection />
    </main>
  )
}
