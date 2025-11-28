'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import TestimonialsSection from '@/components/TestimonialsSection'
import FaqSection from '@/components/FaqSection'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const }
  }
}

export default function Home() {
  return (
    <main className="bg-slate-950">
      <motion.section
        className="border-b border-slate-900 bg-linear-to-r from-emerald-500/8 via-slate-950 to-sky-500/8"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:pb-24 md:pt-16">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              Italian digital studio
            </p>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
              Marketing, design and custom software for ambitious brands.
            </h1>
            <p className="mb-6 max-w-xl text-sm text-slate-200 sm:text-base">
              Nivello Studio blends strategy, aesthetics, and technology to help
              Italian companies look sharp, communicate clearly, and sell better.
              From landing pages to full digital ecosystems.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                href="/work"
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200"
              >
                View our work
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-700 bg-slate-900/50 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/80"
              >
                Book a call
              </Link>
            </div>
            <div className="grid gap-4 text-xs text-slate-400 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/40 bg-linear-to-b from-emerald-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-emerald-300">
                  Marketing
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Funnels, campaigns and automation adapted to the Italian market.
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-linear-to-b from-sky-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-sky-300">
                  Design
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Brand-aligned visuals and clean interfaces that feel premium.
                </p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/40 bg-linear-to-b from-fuchsia-500/15 via-slate-950 to-slate-950 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-fuchsia-300">
                  Development
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Fast, responsive websites built with modern React and Next.js.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end max-sm:justify-center">
            <div className="relative w-full max-w-sm">
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-4xl bg-[conic-gradient(at_top,rgba(16,185,129,0.5),rgba(56,189,248,0.35),rgba(244,114,182,0.35),transparent_70%)] opacity-80 blur-3xl" />

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-lg shadow-emerald-500/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Typical project
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-50">
                    Launch-ready marketing site in 4–6 weeks.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Ideal for SaaS, agencies, and service brands that need a modern
                    presence without a huge internal team.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-medium text-emerald-300">
                      Strategy &amp; positioning
                    </span>
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[0.7rem] font-medium text-sky-300">
                      UX &amp; visual design
                    </span>
                    <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-[0.7rem] font-medium text-fuchsia-300">
                      Next.js development
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-md shadow-emerald-500/30">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      For Italian teams
                    </p>
                    <p className="mt-1">
                      Bilingual sites, local SEO and messaging tuned for the Italian
                      and European market.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-md shadow-sky-500/30">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Collaboration style
                    </p>
                    <p className="mt-1">
                      Async-friendly, clear milestones, and one small team handling
                      strategy, design and build.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-b border-slate-900 bg-slate-950"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                Why Italian brands work with us
              </h2>
              <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
                We mix international standards with a clear understanding of
                local expectations, from language nuance to visual style.
              </p>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Explore our services →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Strategy first
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Every project starts with positioning, goals, and a simple plan.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Clear communication
              </p>
              <p className="mt-2 text-sm text-slate-300">
                English or Italian, async-friendly, structured updates and
                timelines.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-slate-50">
                Modern tech stack
              </p>
              <p className="mt-2 text-sm text-slate-300">
                React, Next.js, and best practices so your site stays fast and
                easy to maintain.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-b border-slate-900 bg-linear-to-r from-slate-950 via-slate-950 to-fuchsia-500/10"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              A simple three-step process
            </h2>
            <p className="mt-2 text-sm text-slate-300 md:max-w-xl">
              No endless calls, no messy handovers. Just a clear path from idea
              to launch.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-emerald-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                1
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Discovery and audit
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We understand your goals, products, and market, then suggest a
                concrete scope.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-sky-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                2
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Design and content
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We craft the visual language, layouts, and copy tailored to your
                audience.
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-sm shadow-fuchsia-500/20">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                3
              </span>
              <p className="text-sm font-semibold text-slate-50">
                Build and launch
              </p>
              <p className="mt-2 text-sm text-slate-300">
                We build, test, and deploy your site, then iterate based on
                real-life usage.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-t border-slate-900 bg-slate-950"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Featured work
              </p>
              <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
                A snapshot of what we build.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Real-world projects across hospitality, SaaS, and e-commerce.
                Names and details can be adapted to match your own portfolio.
              </p>
            </div>
            <Link
              href="/work"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              See more projects →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-emerald-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Hospitality · Website
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Boutique hotel in Tuscany
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                New brand direction and a booking-focused site that speaks to
                international guests.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                +42% direct bookings in six months.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-sky-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                SaaS · Product site
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Workflow platform for SMEs
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Clear positioning and UX aimed at non-technical Italian business
                owners.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                More demo signups from organic traffic.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-fuchsia-500/20">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                E-commerce · Brand refresh
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Direct-to-consumer fashion label
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                A more premium visual language aligned with European streetwear
                aesthetics.
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                Higher add-to-cart rate on new drops.
              </p>
            </article>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-t border-slate-900 bg-linear-to-l from-slate-950 via-slate-950 to-sky-500/10"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Fit
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Who we work best with.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              We are a good match if you care about details, want honest input,
              and prefer a partner that feels like part of your team.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-emerald-500/20">
              <p className="text-sm font-semibold text-slate-50">
                You&apos;ll feel at home if
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>You want a modern, clean look that still feels human.</li>
                <li>You are open to clear feedback on messaging and UX.</li>
                <li>You prefer structured updates over endless meetings.</li>
                <li>
                  You&apos;re selling something real and want the site to match
                  that quality.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-sky-500/20">
              <p className="text-sm font-semibold text-slate-50">
                What you can expect
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>A clear timeline and defined milestones before we start.</li>
                <li>Designs reviewed in Figma or similar before development.</li>
                <li>Fast, responsive implementation using React and Next.js.</li>
                <li>
                  Thoughtful details tailored to the Italian and European
                  market.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
                >
                  Start a project conversation
                </Link>
                <Link
                  href="/services"
                  className="flex items-center text-xs font-medium text-emerald-300 hover:text-emerald-200"
                >
                  Learn more about how we work →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <TestimonialsSection />
      <FaqSection />
    </main>
  )
}