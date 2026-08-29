'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Clock3, Globe2, Mail, MessageSquare, Plus, Send } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import MessageSendAnimation from '@/components/MessageSendAnimation'
import type { Locale } from '@/lib/site'

type Step = { title: string; body: string }
type Faq = { question: string; answer: string }

const copy = {
  en: {
    eyebrow: 'Contact',
    titleStart: 'Tell us what you are ',
    titleAccent: 'building.',
    intro: 'We will help shape the next step. Share a bit about your brand, your goals, and your timing. We usually reply within one business day.',
    replyBadge: 'Usually replies within one business day',
    meta: ['Working across Europe', 'office@nivello.it'],
    emailCta: 'Email us directly',
    nextTitle: 'What happens next',
    steps: [
      { title: 'We read and reply', body: 'A real answer from a person, not an autoresponder. Usually within one business day.' },
      { title: 'A short call, if useful', body: 'Twenty to thirty minutes to align on goals, scope, and constraints. No pitch deck.' },
      { title: 'A written proposal', body: 'Clear scope, timeline, and price. You decide from there, with no pressure.' }
    ] satisfies Step[],
    includesTitle: 'A good first message includes',
    includes: [
      'Your current website or brand link, if it exists.',
      'The business goal behind the project.',
      'Any deadline, launch date, or internal constraint.',
      'What already feels clear and what still feels messy.'
    ],
    directTitle: 'Prefer plain email?',
    directBody: 'Write to us in Italian or English, whichever you are more comfortable with.',
    faqEyebrow: 'Before you write',
    faqTitle: 'Quick answers, so you can skip the guesswork.',
    faqs: [
      {
        question: 'What does it cost to get in touch?',
        answer: 'Nothing. The first message, our reply, and the intro call are free. You only commit once the scope and price are agreed in writing.'
      },
      {
        question: 'What if I do not know my budget yet?',
        answer: 'Pick "Not sure yet" in the form. Describe what you need and we will come back with a realistic range before anything is decided.'
      },
      {
        question: 'Can we work in Italian?',
        answer: 'Yes. We work in Italian and English, both in writing and on calls. Pick whichever is easier for you.'
      },
      {
        question: 'I only need a small change, not a full site.',
        answer: 'Still worth asking. If a small fix is genuinely all you need, we will tell you that instead of proposing a bigger project.'
      }
    ] satisfies Faq[]
  },
  it: {
    eyebrow: 'Contatti',
    titleStart: 'Raccontaci cosa vuoi ',
    titleAccent: 'costruire.',
    intro: 'Ti aiutiamo a definire il prossimo passo. Raccontaci il brand, gli obiettivi e le tempistiche. Di solito rispondiamo entro un giorno lavorativo.',
    replyBadge: 'Di solito rispondiamo entro un giorno lavorativo',
    meta: ['Attivi in Europa', 'office@nivello.it'],
    emailCta: 'Scrivici direttamente',
    nextTitle: 'Cosa succede dopo',
    steps: [
      { title: 'Leggiamo e rispondiamo', body: 'Una risposta vera, scritta da una persona. Di solito entro un giorno lavorativo.' },
      { title: 'Una call breve, se serve', body: 'Venti o trenta minuti per allineare obiettivi, scope e vincoli. Senza presentazioni commerciali.' },
      { title: 'Una proposta scritta', body: 'Scope, tempi e prezzo chiari. Da lì decidi tu, senza pressioni.' }
    ] satisfies Step[],
    includesTitle: 'Un buon primo messaggio include',
    includes: [
      'Il sito o il link del brand, se esiste.',
      'L’obiettivo business dietro al progetto.',
      'Scadenze, date di lancio o vincoli interni.',
      'Cosa è già chiaro e cosa è ancora confuso.'
    ],
    directTitle: 'Preferisci una semplice email?',
    directBody: 'Scrivici in italiano o in inglese, come preferisci.',
    faqEyebrow: 'Prima di scrivere',
    faqTitle: 'Risposte rapide, così non devi tirare a indovinare.',
    faqs: [
      {
        question: 'Quanto costa mettersi in contatto?',
        answer: 'Niente. Il primo messaggio, la nostra risposta e la call iniziale sono gratuiti. Ti impegni solo quando scope e prezzo sono concordati per iscritto.'
      },
      {
        question: 'E se non ho ancora un budget?',
        answer: 'Scegli "Non lo so ancora" nel form. Raccontaci cosa ti serve e ti proponiamo un range realistico prima di decidere qualsiasi cosa.'
      },
      {
        question: 'Possiamo lavorare in italiano?',
        answer: 'Sì. Lavoriamo in italiano e in inglese, per iscritto e in call. Scegli la lingua che ti è più comoda.'
      },
      {
        question: 'Mi serve solo una piccola modifica, non un sito intero.',
        answer: 'Chiedi comunque. Se davvero basta un intervento piccolo te lo diciamo, invece di proporti un progetto più grande.'
      }
    ] satisfies Faq[]
  }
} satisfies Record<Locale, unknown>

const metaIcons = [Globe2, Mail]

export default function ContactPage({ locale = 'en' }: { locale?: Locale }) {
  const content = copy[locale]
  const reducedMotion = useReducedMotion()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // `initial` stays constant across server and client so the reduced-motion
  // path still animates opacity back to 1 instead of leaving the page blank.
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-90px' },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' as const, delay }
  })

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-40 dark:opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(100,116,139,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.14) 1px, transparent 1px)',
              backgroundSize: '58px 58px',
              maskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 35%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 35%, transparent 100%)'
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                {content.eyebrow}
              </span>
            </div>

            <h1 className="mt-6 font-display text-[2.7rem] font-bold leading-[1.02] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.6rem] dark:text-white">
              {content.titleStart}
              <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">{content.titleAccent}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300/85">{content.intro}</p>

            <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/70 px-4 py-2 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{content.replyBadge}</span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {content.meta.map((label, index) => {
                const Icon = metaIcons[index]
                return (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-sm text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    <Icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                    {label}
                  </span>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.12 }}
            className="order-first lg:order-last"
          >
            <MessageSendAnimation />
          </motion.div>
        </div>
      </section>

      {/* ── Form + side rail ─────────────────────────────────── */}
      <section className="relative border-t border-slate-200/70 dark:border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:px-8 lg:py-20">
          <ContactForm locale={locale} />

          <div className="flex flex-col gap-6">
            {/* What happens next */}
            <motion.aside
              {...rise(0.05)}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">{content.nextTitle}</p>
              </div>

              <ol className="relative mt-5 space-y-5">
                <span
                  aria-hidden
                  className="absolute left-[13px] top-2 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-[var(--brand-blue)]/40 via-slate-200 to-transparent dark:from-[var(--brand-gold)]/40 dark:via-white/10"
                />
                {content.steps.map((step, index) => (
                  <li key={step.title} className="relative flex gap-4">
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-500 dark:border-white/15 dark:bg-slate-950 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.aside>

            {/* A good first message includes */}
            <motion.aside
              {...rise(0.12)}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">{content.includesTitle}</p>
              </div>
              <ul className="mt-4 space-y-3">
                {content.includes.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)]/12 dark:bg-[var(--brand-gold)]/15">
                      <Check className="h-3 w-3 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.aside>

            {/* Direct email */}
            <motion.aside
              {...rise(0.18)}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.05] dark:to-transparent dark:shadow-none"
            >
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">{content.directTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{content.directBody}</p>
              <a
                href="mailto:office@nivello.it"
                className="group mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                office@nivello.it
              </a>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* ── Pre-contact FAQ ──────────────────────────────────── */}
      <section className="relative border-t border-slate-200/70 dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <motion.div {...rise()} className="mb-8 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {content.faqEyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {content.faqTitle}
            </h2>
          </motion.div>

          <motion.div
            {...rise(0.06)}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
          >
            {content.faqs.map((item, index) => {
              const isOpen = index === openFaq
              const isLast = index === content.faqs.length - 1

              return (
                <div key={item.question} className={isLast ? '' : 'border-b border-slate-100 dark:border-white/[0.08]'}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(prev => (prev === index ? null : index))}
                    aria-expanded={isOpen}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors ${
                      isOpen
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/[0.04] dark:hover:text-white'
                    }`}
                  >
                    <span>{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeInOut' }}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isOpen
                          ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] dark:border-[var(--brand-gold)] dark:text-[var(--brand-gold)]'
                          : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>
    </main>
  )
}
