'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Eduard',
    role: 'Owner, restaurant RomboNord',
    quote:
      'Nivello gave us a modern site and a clearer story. We finally feel proud to share the link with guests.',
    detail:
      'Direct bookings increased and our international clients understand the offer faster.'
  },
  {
    name: 'Camelie',
    role: 'Owner, guesthouse LeCamelie',
    quote:
      'They translated a complex product into a simple narrative. Our demo requests are more qualified.',
    detail:
      'The new site speaks to non-technical decision makers without feeling dumbed down.'
  },
  {
    name: 'Gjergj',
    role: 'Owner, author portfolio',
    quote:
      'Communication was clear, deadlines were respected, and every design choice had a reason behind it.',
    detail:
      'It felt like working with an internal product team rather than an external agency.'
  },
  {
    name: 'ConstTeam',
    role: 'Founders, Consteam',
    quote:
      'They helped us turn a complex consulting offer into a clean, trustworthy presence that feels truly European.',
    detail:
      'The new site explains what we do in seconds and gives us a solid base for future content and lead generation.'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Testimonials
            </p>
            <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
              Teams that work with us tend to come back.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Names and details are lightly anonymised, but the situations and
              results are real.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-md shadow-emerald-500/30"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <blockquote className="text-sm text-slate-200">
                “{t.quote}”
              </blockquote>
              <p className="mt-3 text-xs text-slate-400">{t.detail}</p>
              <figcaption className="mt-4 text-sm text-slate-100">
                {t.name}
                <span className="block text-xs text-slate-400">{t.role}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}