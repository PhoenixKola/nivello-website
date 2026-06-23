'use client'

import { motion } from 'framer-motion'
import { Check, Code2, Compass, Megaphone, Palette } from 'lucide-react'

const serviceCards = [
  {
    label: 'Strategy',
    title: 'Strategy',
    desc: 'Positioning, offer structure, and a practical plan before design starts.',
    items: ['Audience and offer clarity', 'Site structure and priorities', 'Conversion path mapping', 'Launch plan and next steps'],
    ideal: 'Ideal when the business needs sharper direction.',
    icon: Compass,
    color: 'var(--brand-gold)'
  },
  {
    label: 'Marketing',
    title: 'Marketing',
    desc: 'Messaging and campaign thinking that turn attention into qualified leads.',
    items: ['Landing pages and sales pages', 'Messaging and microcopy', 'Lead magnets and email flow ideas', 'Basic analytics and tracking setup'],
    ideal: 'Ideal for launches, lead generation, and clearer offers.',
    icon: Megaphone,
    color: 'var(--brand-blue)'
  },
  {
    label: 'Design',
    title: 'Brand & product design',
    desc: 'Clean, contemporary visuals that feel at home in the Italian and European market.',
    items: ['Brand look and feel', 'Website and app UI design', 'Design systems and components', 'Marketing visuals and assets'],
    ideal: 'Ideal for SaaS, agencies, and service businesses.',
    icon: Palette,
    color: 'var(--brand-purple)'
  },
  {
    label: 'Development',
    title: 'Development & implementation',
    desc: 'Fast, SEO-friendly websites built with a focus on maintainability.',
    items: ['Corporate sites and landing pages', 'Custom React and Next.js frontends', 'Headless CMS integration on request', 'Performance and accessibility checks'],
    ideal: 'Ideal when you want a long-term technical partner.',
    icon: Code2,
    color: 'var(--brand-blue)'
  }
]

export default function ServicesClient() {
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
                  <service.icon className="h-4 w-4" style={{ color: service.color }} />
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
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{s.desc}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-5 text-xs font-medium text-slate-500 dark:text-slate-400">{s.ideal}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
