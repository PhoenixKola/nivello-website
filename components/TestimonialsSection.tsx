'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Eduard',
    role: 'Owner, restaurant RomboNord',
    avatar: 'bg-[var(--brand-gold)] text-slate-950',
    quote: 'Nivello gave us a modern site and a clearer story. We finally feel proud to share the link with guests.',
    detail: 'Direct bookings increased and our international clients understand the offer faster.'
  },
  {
    name: 'Camelie',
    role: 'Owner, guesthouse LeCamelie',
    avatar: 'bg-[var(--brand-blue)] text-white',
    quote: 'They translated a complex product into a simple narrative. Our demo requests are more qualified.',
    detail: 'The new site speaks to non-technical decision makers without feeling dumbed down.'
  },
  {
    name: 'Gjergj',
    role: 'Owner, author portfolio',
    avatar: 'bg-[var(--brand-purple)] text-white',
    quote: 'Communication was clear, deadlines were respected, and every design choice had a reason behind it.',
    detail: 'It felt like working with an internal product team rather than an external agency.'
  },
  {
    name: 'Consteam',
    role: 'Founders, Consteam',
    avatar: 'bg-[var(--brand-gold)] text-slate-950',
    quote: 'They helped us turn a complex consulting offer into a clean, trustworthy presence that feels truly European.',
    detail: 'The new site explains what we do in seconds and gives us a solid base for future content and lead generation.'
  },
  {
    name: 'Davide',
    role: 'Founder, Your Assist in Italy',
    avatar: 'bg-[#DC2626] text-white',
    quote: 'Nivello made our services immediately clear. International clients now understand what we offer before even booking a call.',
    detail: 'The site structure and copy changed how expats perceive us — professional, approachable, and trustworthy.'
  }
]

const clients = ['Rombo Nord', 'Le Camelie', 'Your Assist in Italy', 'Consteam', 'Gjergj Jozef Kola']

function Stars() {
  return (
    <div className="mb-4 flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              Testimonials
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              Teams that work with us tend to come back.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Names and details are lightly anonymised, but the situations and results are real.
            </p>
          </div>
        </div>

        {/* Client trust strip */}
        <div className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-slate-200/70 py-5 dark:border-white/10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Trusted by</span>
          {clients.map(c => (
            <span key={c} className="font-display text-base font-medium text-slate-500 dark:text-slate-300/70">{c}</span>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20 dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.22)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div>
                <Stars />
                <blockquote className="text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-200">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <p className="mt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{t.detail}</p>
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.avatar} text-sm font-semibold shadow-sm`}>
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
