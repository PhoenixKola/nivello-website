'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import TestimonialsSection from '@/components/TestimonialsSection'
import FaqSection from '@/components/FaqSection'
import BottomCta from '@/components/BottomCta'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}


export default function Home() {
  return (
    <main className="bg-white dark:bg-[#020408]">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">

        {/* ── Light mode background ── */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute inset-0 bg-[#fafaf9]" />
          {/* Editorial warm wash */}
          <div className="absolute inset-0 bg-linear-to-br from-stone-50 via-white to-sky-50/30" />
          {/* Emerald accent glow */}
          <div className="absolute bottom-0 right-1/3 h-[700px] w-[700px] translate-y-1/3 rounded-full bg-emerald-400/[0.07] blur-[160px]" />
          {/* Sky top right */}
          <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/4 -translate-y-1/4 rounded-full bg-sky-300/[0.06] blur-[120px]" />
          {/* Horizontal rule at the base of hero */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* ── Dark mode: directional studio atmosphere ── */}
        <div className="absolute inset-0 hidden dark:block">
          {/* Base: near-black studio dark */}
          <div className="absolute inset-0 bg-[#020408]" />
          {/* Main: right-side monitor glow — large emerald/teal, warm and diffuse */}
          <div className="absolute right-0 top-1/2 h-[1100px] w-[1100px] translate-x-[35%] -translate-y-1/2 rounded-full bg-emerald-500/[0.13] blur-[200px]" />
          {/* Overhead / secondary screen: sky blue, top-right corner */}
          <div className="absolute right-0 top-0 h-[650px] w-[650px] translate-x-[20%] -translate-y-[25%] rounded-full bg-sky-400/[0.11] blur-[160px]" />
          {/* Left-wall bounce: very subtle fuchsia depth */}
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-[35%] -translate-y-1/2 rounded-full bg-fuchsia-500/[0.055] blur-[130px]" />
          {/* Italian warmth: amber, center-left */}
          <div className="absolute left-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-amber-400/[0.045] blur-[100px]" />
          {/* Fine architectural grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
              backgroundSize: '72px 72px'
            }}
          />
          {/* Directional vignette: bright center-right, dark edges */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 90% 75% at 62% 50%, transparent 10%, rgba(2,4,8,0.82) 100%)' }}
          />
          {/* Bottom edge fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#020408] to-transparent" />
          {/* Top edge fade */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-[#020408] to-transparent" />
        </div>

        {/* ── Ghost "STUDIO" — design accent ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex select-none items-center overflow-hidden"
        >
          <span
            className="font-black uppercase leading-none tracking-tighter text-slate-900/4 dark:text-white/[0.022]"
            style={{ fontSize: 'clamp(5rem, 16vw, 16rem)' }}
          >
            STUDIO
          </span>
        </div>

        {/* ── Horizontal rule at bottom (dark) ── */}
        <div className="absolute bottom-0 left-0 right-0 hidden h-px dark:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(16,185,129,0.2) 50%, rgba(255,255,255,0.06) 70%, transparent)' }} />

        {/* ── Main content — two columns ── */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[6fr_7fr] lg:gap-10">

            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/4 dark:backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">
                  Based in Italy · Working across Europe
                </span>
              </motion.div>

              <h1 className="mb-6 text-[2.6rem] font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] dark:text-white">
                Premium websites
                <br />
                for{' '}
                <span className="italic">
                  <span className="bg-clip-text text-transparent dark:hidden" style={{ backgroundImage: 'linear-gradient(135deg, #047857 0%, #0369a1 45%, #a21caf 100%)' }}>ambitious</span>
                  <span className="hidden bg-clip-text text-transparent dark:inline" style={{ backgroundImage: 'linear-gradient(135deg, #6ee7b7 0%, #38bdf8 48%, #f0abfc 100%)' }}>ambitious</span>
                </span>
                {' '}Italian brands.
              </h1>

              <p className="mb-10 max-w-[460px] text-base leading-relaxed text-slate-500 sm:text-[1.05rem] dark:text-slate-300/70">
                Strategy, design, and Next.js development for brands that want to look sharper, communicate clearly, and convert better.
              </p>

              <div className="mb-10 flex flex-wrap gap-4">
                <Link href="/work" className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                  View our work
                </Link>
                <Link href="/contact" className="rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/9">
                  Book a call →
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: '🇮🇹', label: 'Italian & English' },
                  { icon: '🎯', label: 'Strategy to launch' },
                  { icon: '⚡', label: 'React / Next.js' },
                  { icon: '🌍', label: 'EU-friendly' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: browser mockup + floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden pl-6 pr-4 pt-10 pb-10 lg:block"
            >
              {/* Floating badge — Brand Strategy (left) */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="absolute left-0 top-[28%] z-20"
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.8, delay: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">● Brand Strategy</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Positioning &amp; messaging</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating badge — UX/UI Design (top right) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.05 }}
                className="absolute right-0 top-0 z-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.2, delay: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">● UX/UI Design</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Figma to production</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating badge — Next.JS (bottom left) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.25 }}
                className="absolute bottom-0 left-6 z-20"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, delay: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-slate-700/70 dark:bg-slate-900">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">● Next.JS Development</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">App Router · TypeScript</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Browser frame */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-[#0d1117] dark:shadow-black/50">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-[#161b22]">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <div className="mx-3 flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">nivello.it</span>
                  </div>
                </div>
                {/* Content — pure wireframe skeleton */}
                <div className="flex gap-4 p-5">
                  {/* Left sidebar skeleton */}
                  <div className="w-32 shrink-0 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                    {[85, 65, 90, 55, 75, 45, 80, 60].map((w, i) => (
                      <div key={i} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700/80" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {/* Main area skeleton */}
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-4/5 rounded-full bg-emerald-200/80 dark:bg-emerald-500/25" />
                      <div className="flex gap-2.5 pt-1">
                        <div className="h-8 flex-1 rounded-xl bg-slate-200/80 dark:bg-slate-700/60" />
                        <div className="h-8 flex-1 rounded-xl bg-sky-200/70 dark:bg-sky-800/35" />
                        <div className="h-8 flex-1 rounded-xl bg-fuchsia-200/60 dark:bg-fuchsia-800/25" />
                      </div>
                      <div className="h-2.5 w-3/4 rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                      <div className="h-2.5 w-1/2 rounded-full bg-slate-200/50 dark:bg-slate-700/40" />
                    </div>
                    {/* Bottom row */}
                    <div className="flex gap-2.5">
                      {[
                        'bg-emerald-200/70 dark:bg-emerald-500/20',
                        'bg-sky-200/60 dark:bg-sky-800/30',
                        'bg-fuchsia-200/50 dark:bg-fuchsia-800/20'
                      ].map((cls, i) => (
                        <div key={i} className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                          <div className={`h-2 w-full rounded-full ${cls}`} />
                          <div className="mt-1.5 h-2 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="mt-1.5 h-2 w-3/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* ─── Why brands work with us ──────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
                Why Italian brands work with us
              </h2>
              <p className="mt-2 text-sm text-slate-500 md:max-w-xl dark:text-slate-300">
                We mix international standards with a clear understanding of local expectations, from language nuance to visual style.
              </p>
            </div>
            <Link href="/services" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
              Explore our services →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Strategy first', body: 'Every project starts with positioning, goals, and a simple plan.' },
              { title: 'Clear communication', body: 'English or Italian, async-friendly, structured updates and timelines.' },
              { title: 'Modern tech stack', body: 'React, Next.js, and best practices so your site stays fast and easy to maintain.' }
            ].map(c => (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Three-step process ───────────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">A simple three-step process</h2>
            <p className="mt-2 text-sm text-slate-500 md:max-w-xl dark:text-slate-300">No endless calls, no messy handovers. Just a clear path from idea to launch.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: '1', title: 'Discovery and audit', body: 'We understand your goals, products, and market, then suggest a concrete scope.' },
              { n: '2', title: 'Design and content', body: 'We craft the visual language, layouts, and copy tailored to your audience.' },
              { n: '3', title: 'Build and launch', body: 'We build, test, and deploy your site, then iterate based on real-life usage.' }
            ].map(s => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
                <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {s.n}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Featured work ────────────────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Featured work</p>
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">A snapshot of what we build.</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">Real-world projects across hospitality, SaaS, and e-commerce.</p>
            </div>
            <Link href="/work" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">See more projects →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { cat: 'Hospitality · Website', title: 'Boutique hotel in Tuscany', body: 'New brand direction and a booking-focused site that speaks to international guests.', stat: '+42% direct bookings in six months.' },
              { cat: 'SaaS · Product site', title: 'Workflow platform for SMEs', body: 'Clear positioning and UX aimed at non-technical Italian business owners.', stat: 'More demo signups from organic traffic.' },
              { cat: 'E-commerce · Brand refresh', title: 'Direct-to-consumer fashion label', body: 'A more premium visual language aligned with European streetwear aesthetics.', stat: 'Higher add-to-cart rate on new drops.' },
              { cat: 'Expat Services · Consulting', title: 'Your Assist in Italy', body: 'Bilingual site for an immigration consultancy helping expats navigate Italian bureaucracy with confidence.', stat: 'Cleaner positioning, more direct enquiries.' }
            ].map(p => (
              <article key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.cat}</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{p.body}</p>
                <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">{p.stat}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Who we work best with ────────────────────────────────────────── */}
      <motion.section
        className="border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950"
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Fit</p>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">Who we work best with.</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
              We are a good match if you care about details, want honest input, and prefer a partner that feels like part of your team.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">You&apos;ll feel at home if</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                <li>You want a modern, clean look that still feels human.</li>
                <li>You are open to clear feedback on messaging and UX.</li>
                <li>You prefer structured updates over endless meetings.</li>
                <li>You&apos;re selling something real and want the site to match that quality.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">What you can expect</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                <li>A clear timeline and defined milestones before we start.</li>
                <li>Designs reviewed in Figma or similar before development.</li>
                <li>Fast, responsive implementation using React and Next.js.</li>
                <li>Thoughtful details tailored to the Italian and European market.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200">
                  Start a project conversation
                </Link>
                <Link href="/services" className="flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
                  Learn more about how we work →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <TestimonialsSection />
      <FaqSection />
      <BottomCta />
    </main>
  )
}
