'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

const faqs = [
  {
    question: 'How long does a typical website project take?',
    answer: 'Most projects take between two and six weeks depending on scope, content readiness, and feedback speed.'
  },
  {
    question: 'Do you only work with Italian companies?',
    answer: 'We are based in Italy but work comfortably with clients across Europe. Communication can be in Italian or English.'
  },
  {
    question: 'Can you help with content and copy, not just design?',
    answer: 'Yes. We often refine structure, messaging, and microcopy to make sure the design supports a clear narrative.'
  },
  {
    question: 'What does collaboration look like week to week?',
    answer: 'You get a clear plan, async updates, and specific checkpoints for feedback. No endless status calls unless you want them.'
  }
]

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  return (
    <section className="border-t border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
            FAQ
          </p>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
            Questions we hear a lot.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
            If something is not covered here, send us a short message and we will answer directly.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80">
          {faqs.map((item, index) => {
            const isOpen = index === activeIndex
            const isLast = index === faqs.length - 1

            return (
              <div key={item.question} className={!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(prev => (prev === index ? null : index))}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors ${
                    isOpen
                      ? 'bg-slate-100/60 text-slate-900 dark:bg-slate-900/60 dark:text-slate-50'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-slate-50'
                  }`}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-base leading-none transition-colors ${
                      isOpen
                        ? 'border-emerald-400 text-emerald-500 dark:border-emerald-500 dark:text-emerald-400'
                        : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                    }`}
                  >
                    +
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-3">
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Still unsure?{' '}
          <Link href="/contact" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
            Send us a quick message
          </Link>{' '}
          and we&apos;ll let you know if we are the right fit or not.
        </p>
      </div>
    </section>
  )
}
