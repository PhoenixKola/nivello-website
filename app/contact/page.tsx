'use client'

import { motion } from 'framer-motion'
import { FormEvent, useState } from 'react'

const FORM_ENDPOINT = 'https://formspree.io/f/xyzlpdkl'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-emerald-500/70 dark:focus:ring-emerald-500/20'
const selectCls = `${inputCls} dark:[color-scheme:dark]`

export default function ContactPage() {
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
      if (response.ok) { setStatus('success'); form.reset() }
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-white dark:bg-slate-950">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/3 -translate-y-1/4 rounded-full bg-emerald-400/8 blur-[130px] dark:bg-emerald-500/10" />
          <div className="absolute right-1/3 bottom-0 h-[400px] w-[400px] translate-y-1/4 rounded-full bg-sky-400/6 blur-[100px] dark:bg-sky-500/8" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Contact</span>
              </div>

              <h1 className="mb-4 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
                Tell us what you&apos;re{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #059669 0%, #0284c7 55%, #c026d3 100%)' }}
                >
                  building.
                </span>
              </h1>

              <p className="mb-6 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
                We&apos;ll help shape the next step. Share a bit about your brand, your goals, and your timing. We usually reply within one business day.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {[
                  { icon: '📍', label: 'Based in Italy' },
                  { icon: '🌍', label: 'Working across Europe' },
                  { icon: '📧', label: 'office@nivello.it' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Form + sidebar ──────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:py-16">

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90"
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Name <span className="text-rose-400" aria-hidden>*</span>
                  </label>
                  <input id="name" name="name" required className={inputCls} placeholder="Your full name" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Email <span className="text-rose-400" aria-hidden>*</span>
                  </label>
                  <input id="email" name="email" type="email" required className={inputCls} placeholder="you@company.com" />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Company
                </label>
                <input id="company" name="company" className={inputCls} placeholder="Brand, studio, startup..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="budget" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Approx. budget <span className="text-rose-400" aria-hidden>*</span>
                  </label>
                  <select id="budget" name="budget" defaultValue="" className={selectCls}>
                    <option value="" disabled>Select a range</option>
                    <option value="under-3k">Under €3,000</option>
                    <option value="3-7k">€3,000 – €7,000</option>
                    <option value="7-15k">€7,000 – €15,000</option>
                    <option value="15k-plus">€15,000+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timeline" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Ideal timeline <span className="text-rose-400" aria-hidden>*</span>
                  </label>
                  <select id="timeline" name="timeline" defaultValue="" className={selectCls}>
                    <option value="" disabled>Choose an option</option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-2-months">Within 1–2 months</option>
                    <option value="3-plus-months">In 3+ months</option>
                    <option value="not-sure">Not sure yet</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                  Tell us about your project <span className="text-rose-400" aria-hidden>*</span>
                </label>
                <textarea id="message" name="message" required rows={5} className={inputCls} placeholder="Share what you do, what you need, and any links we should see." />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={status === 'submitting' || status === 'success'}
                  className="inline-flex w-44 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {status === 'submitting' ? 'Sending...' : status === 'success' ? 'Message sent ✓' : 'Send message'}
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  By sending this form you agree we can use your details to contact you about this project.
                </p>
              </div>

              {status === 'success' && (
                <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  Thank you for your message. We&apos;ll get back to you shortly.
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 text-xs text-rose-500 dark:text-rose-300">
                  Something went wrong. Please try again or email us at{' '}
                  <a href="mailto:office@nivello.it" className="underline">office@nivello.it</a>.
                </p>
              )}
            </form>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/90"
          >
            {[
              {
                label: 'Preferred collaboration',
                body: 'We enjoy long-term collaborations with brands, agencies, and startups that value clear communication and clean design.'
              },
              {
                label: 'Typical projects',
                list: ['New marketing site for a product or service', 'Full redesign of an outdated website', 'Brand and UX refresh for a SaaS or platform']
              },
              {
                label: 'Direct contact',
                email: true
              }
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{s.label}</p>
                {s.body && <p className="mt-2 text-slate-600 dark:text-slate-300">{s.body}</p>}
                {s.list && (
                  <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    {s.list.map(item => <li key={item}>• {item}</li>)}
                  </ul>
                )}
                {s.email && (
                  <div className="mt-2">
                    <p className="text-slate-600 dark:text-slate-300">
                      Email:{' '}
                      <a href="mailto:office@nivello.it" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200">
                        office@nivello.it
                      </a>
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Based in Italy, comfortable working across European time zones.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </motion.aside>
        </div>
      </section>
    </main>
  )
}
