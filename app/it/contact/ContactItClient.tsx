'use client'

import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Globe2, Mail, MapPin } from 'lucide-react'

const FORM_ENDPOINT = 'https://formspree.io/f/xyzlpdkl'
type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[var(--brand-gold)] dark:focus:ring-[var(--brand-gold)]/15'
const selectCls = `${inputCls} cursor-pointer appearance-none pr-12 dark:[color-scheme:dark]`
const optionCls = 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50'

export default function ContactItClient() {
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
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Contatti</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Raccontaci cosa vuoi <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">costruire.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Ti aiutiamo a definire il prossimo passo. Raccontaci il brand, gli obiettivi e le tempistiche. Di solito rispondiamo entro un giorno lavorativo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { icon: MapPin, label: 'Basati in Italia' },
                { icon: Globe2, label: 'Attivi in Europa' },
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome *<input name="name" required className={`${inputCls} mt-1.5`} placeholder="Il tuo nome" /></label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email *<input name="email" type="email" required className={`${inputCls} mt-1.5`} placeholder="tu@azienda.com" /></label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Azienda<input name="company" className={`${inputCls} mt-1.5`} placeholder="Nome azienda o brand" /></label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo di progetto *
                <div className="relative mt-1.5">
                  <select name="projectType" required className={selectCls}>
                    <option value="" className={optionCls}>Seleziona</option>
                    <option className={optionCls}>Sito web / landing page</option>
                    <option className={optionCls}>Marketing e messaggio</option>
                    <option className={optionCls}>Design system / UI</option>
                    <option className={optionCls}>Software custom</option>
                    <option className={optionCls}>Non lo so ancora</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tempistiche
                <div className="relative mt-1.5">
                  <select name="timing" className={selectCls}>
                    <option className={optionCls}>Flessibile</option>
                    <option className={optionCls}>Entro 1 mese</option>
                    <option className={optionCls}>1-3 mesi</option>
                    <option className={optionCls}>Piu avanti quest&apos;anno</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Messaggio *<textarea name="message" required rows={6} className={`${inputCls} mt-1.5 resize-y`} placeholder="Raccontaci cosa vuoi costruire, migliorare o lanciare." /></label>
            </div>
            <button type="submit" disabled={status === 'submitting'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 sm:w-auto dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
              {status === 'submitting' ? 'Invio...' : 'Invia messaggio'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {status === 'success' && <p className="mt-3 text-xs font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">Grazie. Il messaggio e stato inviato.</p>}
            {status === 'error' && <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-300">Qualcosa non ha funzionato. Scrivi direttamente a office@nivello.it.</p>}
          </motion.form>

          <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="h-fit rounded-2xl border border-slate-200 bg-stone-50 p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">Un buon primo messaggio include</p>
            <ul className="mt-4 space-y-3 text-slate-500 dark:text-slate-300">
              <li>Il sito o link del brand, se esiste.</li>
              <li>L&apos;obiettivo business dietro il progetto.</li>
              <li>Scadenze, date di lancio o vincoli interni.</li>
              <li>Cosa e gia chiaro e cosa e ancora confuso.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email diretta</p>
              <a href="mailto:office@nivello.it" className="mt-1 inline-flex text-sm font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">office@nivello.it</a>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  )
}
