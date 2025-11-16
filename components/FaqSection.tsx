'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    question: 'How long does a typical website project take?',
    answer:
      'Most projects take between two and six weeks depending on scope, content readiness, and feedback speed.'
  },
  {
    question: 'Do you only work with Italian companies?',
    answer:
      'We are based in Italy but work comfortably with clients across Europe. Communication can be in Italian or English.'
  },
  {
    question: 'Can you help with content and copy, not just design?',
    answer:
      'Yes. We often refine structure, messaging, and microcopy to make sure the design supports a clear narrative.'
  },
  {
    question: 'What does collaboration look like week to week?',
    answer:
      'You get a clear plan, async updates, and specific checkpoints for feedback. No endless status calls unless you want them.'
  }
]

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  return (
    <section className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            FAQ
          </p>
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Questions we hear a lot.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            If something is not covered here, send us a short message and we
            will answer directly.
          </p>
        </div>

        <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/80">
          {faqs.map((item, index) => {
            const isOpen = index === activeIndex
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(prev => (prev === index ? null : index))
                  }
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm text-slate-100 hover:bg-slate-900/80 md:px-5"
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-slate-300 md:px-5">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Still unsure?{' '}
          <Link
            href="/contact"
            className="text-emerald-300 hover:text-emerald-200"
          >
            Send us a quick message
          </Link>{' '}
          and we&apos;ll let you know if we are the right fit or not.
        </p>
      </div>
    </section>
  )
}