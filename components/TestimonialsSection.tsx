'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Eduard',
    role: 'Owner, restaurant RomboNord',
    quote: 'Nivello gave us a modern site and a clearer story. We finally feel proud to share the link with guests.',
    detail: 'Direct bookings increased and our international clients understand the offer faster.'
  },
  {
    name: 'Camelie',
    role: 'Owner, guesthouse LeCamelie',
    quote: 'They translated a complex product into a simple narrative. Our demo requests are more qualified.',
    detail: 'The new site speaks to non-technical decision makers without feeling dumbed down.'
  },
  {
    name: 'Gjergj',
    role: 'Owner, author portfolio',
    quote: 'Communication was clear, deadlines were respected, and every design choice had a reason behind it.',
    detail: 'It felt like working with an internal product team rather than an external agency.'
  },
  {
    name: 'Consteam',
    role: 'Founders, Consteam',
    quote: 'They helped us turn a complex consulting offer into a clean, trustworthy presence that feels truly European.',
    detail: 'The new site explains what we do in seconds and gives us a solid base for future content and lead generation.'
  },
  {
    name: 'Davide',
    role: 'Founder, Your Assist in Italy',
    quote: 'Nivello made our services immediately clear. International clients now understand what we offer before even booking a call.',
    detail: 'The site structure and copy changed how expats perceive us — professional, approachable, and trustworthy.'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
              Testimonials
            </p>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
              Teams that work with us tend to come back.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
              Names and details are lightly anonymised, but the situations and results are real.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -3 }}
            >
              <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{t.detail}</p>
              <figcaption className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
