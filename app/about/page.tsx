'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const values = [
  {
    icon: '🤝',
    title: 'Direct collaboration',
    desc: 'You work with the people actually designing and building your site — no account managers, no handover layers.'
  },
  {
    icon: '🧩',
    title: 'One team, full service',
    desc: 'Strategy, design, and development under one roof. No fragmented suppliers, no communication overhead.'
  },
  {
    icon: '🌍',
    title: 'Italian market expertise',
    desc: 'We understand local expectations, visual standards, and communication norms that generic agencies miss.'
  }
]

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-slate-950">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/4 rounded-full bg-fuchsia-400/6 blur-[130px] dark:bg-fuchsia-500/8" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-400/6 blur-[100px] dark:bg-emerald-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">About Nivello</span>
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3rem] dark:text-slate-50">
                A focused digital studio helping brands{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #c026d3 0%, #0284c7 55%, #059669 100%)' }}
                >
                  look more credible
                </span>{' '}
                online.
              </h1>

              <p className="mb-7 max-w-[500px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
                We combine marketing strategy, interface design, and front-end development in one compact team — so you get a cohesive result without managing multiple suppliers.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
                  Get in touch
                </Link>
                <Link href="/work" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-slate-100">
                  See our work →
                </Link>
              </div>
            </motion.div>

            {/* Right: values cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-xl">{v.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Studio story ──────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5 text-sm leading-relaxed text-slate-500 dark:text-slate-300"
          >
            <p>
              Nivello is a compact digital studio based in Italy, focused on helping companies communicate clearly and look modern across every touchpoint. We combine marketing strategy, interface design and front-end development in one place, so you do not have to manage three different suppliers.
            </p>
            <p>
              We work mainly with founders, small teams and established SMEs that want a partner they can speak to directly. No layers of account managers — you collaborate with the people actually designing and building your site.
            </p>
            <p>
              Our work ranges from marketing websites and simple landing pages to UI for SaaS products and custom front-end builds using React and Next.js. The goal is always the same: a result that looks sharp, feels fast, and supports your business goals.
            </p>
            <p>
              Projects are usually run remotely, with clear milestones, Figma previews and staging links. We keep communication structured and async-friendly so you can focus on your own work while things move forward.
            </p>
            <p>
              If you are looking for a long-term design and development partner that understands both Italian and international expectations, we would be happy to hear from you.
            </p>
          </motion.div>

          <div className="mt-8">
            <Link href="/contact" className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
              Start a conversation
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
