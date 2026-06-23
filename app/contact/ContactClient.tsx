'use client'

import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Globe2, Mail, MapPin } from 'lucide-react'

const FORM_ENDPOINT = 'https://formspree.io/f/xyzlpdkl'
type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[var(--brand-gold)] dark:focus:ring-[var(--brand-gold)]/15'
const selectCls = `${inputCls} cursor-pointer appearance-none pr-12 dark:[color-scheme:dark]`
const optionCls = 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50'

export default function ContactClient() {
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
      if (response.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Contact</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Tell us what you are <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">building.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              We will help shape the next step. Share a bit about your brand, your goals, and your timing. We usually reply within one business day.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { icon: MapPin, label: 'Based in Italy' },
                { icon: Globe2, label: 'Working across Europe' },
                { icon: Mail, label: 'office@nivello.it' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <item.icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] md:py-28">
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Name *
                <input name="name" required className={`${inputCls} mt-1.5`} placeholder="Your name" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Email *
                <input name="email" type="email" required className={`${inputCls} mt-1.5`} placeholder="you@company.com" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
                Company
                <input name="company" className={`${inputCls} mt-1.5`} placeholder="Company or brand name" />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Project type *
                <div className="relative mt-1.5">
                  <select name="projectType" required className={selectCls}>
                    <option value="" className={optionCls}>Select one</option>
                    <option className={optionCls}>Website / landing page</option>
                    <option className={optionCls}>Marketing and messaging</option>
                    <option className={optionCls}>Design system / UI</option>
                    <option className={optionCls}>Custom software</option>
                    <option className={optionCls}>Not sure yet</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Timing
                <div className="relative mt-1.5">
                  <select name="timing" className={selectCls}>
                    <option className={optionCls}>Flexible</option>
                    <option className={optionCls}>Within 1 month</option>
                    <option className={optionCls}>1-3 months</option>
                    <option className={optionCls}>Later this year</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
                Message *
                <textarea name="message" required rows={6} className={`${inputCls} mt-1.5 resize-y`} placeholder="Tell us what you are trying to build, improve, or launch." />
              </label>
            </div>
            <button type="submit" disabled={status === 'submitting'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 sm:w-auto dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
              {status === 'submitting' ? 'Sending...' : 'Send message'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {status === 'success' && <p className="mt-3 text-xs font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">Thanks. Your message has been sent.</p>}
            {status === 'error' && <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-300">Something went wrong. Please email office@nivello.it directly.</p>}
          </motion.form>

          <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="h-fit rounded-2xl border border-slate-200 bg-stone-50 p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">A good first message includes</p>
            <ul className="mt-4 space-y-3 text-slate-500 dark:text-slate-300">
              <li>Your current website or brand link, if it exists.</li>
              <li>The business goal behind the project.</li>
              <li>Any deadline, launch date, or internal constraint.</li>
              <li>What already feels clear and what still feels messy.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Direct email</p>
              <a href="mailto:office@nivello.it" className="mt-1 inline-flex text-sm font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">office@nivello.it</a>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  )
}
